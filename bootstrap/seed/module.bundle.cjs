// @bun
import { Err as Err10, None as None17, Ok as Ok12, Some as Some17, _Array_append as _Array_append14, _Array_concat as _Array_concat10, _Array_flatMap as _Array_flatMap4, _Array_get as _Array_get15, _Array_sort as _Array_sort3, _Map_get as _Map_get12, _Map_getOr as _Map_getOr8, _Map_keys as _Map_keys8, _Map_set as _Map_set11, _Option_mapOr, _Option_unwrapOr as _Option_unwrapOr10, _Result_flatMap as _Result_flatMap8, _Set_add as _Set_add8, _Set_fromArray as _Set_fromArray8, _Set_has as _Set_has8, _Str_codeAt as _Str_codeAt7, _Str_get as _Str_get3, _Str_join as _Str_join9, _Str_length as _Str_length5, _Str_split as _Str_split4, _Str_startsWith as _Str_startsWith6, _Str_trim, _curry as _curry19, and as and11, eq as eq16, filter as filter6, length as length14, map as map14, not as not12, or as or10, reduce as reduce5 } from "@mochi/compiler/runtime";
import { match as match17 } from "@onrails/pattern";

import { Err, None, Ok, Some, _Array_append, _Array_head, _Array_tail, _Option_contains, _Option_exists, _Option_unwrapOr, _Str_codeAt, _Str_fromCode, _Str_get, _Str_join, _Str_length, _Str_slice, _Str_toNumber, _curry, _done, _recur, and, eq, length, not, or } from "@mochi/compiler/runtime";
import { match } from "@onrails/pattern";
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
var TNum = _curry(2, (value, raw) => ({ _tag: "TNum", value, raw }));
var TBool = (value) => ({ _tag: "TBool", value });
var TStr = (value) => ({ _tag: "TStr", value });
var TTmplStart = (value) => ({ _tag: "TTmplStart", value });
var TTmplMid = (value) => ({ _tag: "TTmplMid", value });
var TTmplEnd = (value) => ({ _tag: "TTmplEnd", value });
var TId = (value) => ({ _tag: "TId", value });
var TEof = { _tag: "TEof" };
var DocLine = _curry(2, (text, stop) => ({ _tag: "DocLine", text, stop }));
var PlainOwn = (stop) => ({ _tag: "PlainOwn", stop });
var Trailing = (stop) => ({ _tag: "Trailing", stop });
var cr = _Str_fromCode(13);
var isSpace = (c) => or(eq(c, " "), or(eq(c, "\t"), or(eq(c, `
`), eq(c, cr))));
var inRange = _curry(3, (lo, hi, n) => and(n >= lo, n <= hi));
var isDigit = (c) => _Option_exists(inRange(48, 57), _Str_codeAt(0, c));
var isIdStart = (c) => _Option_exists((n) => or(inRange(65, 90, n), or(inRange(97, 122, n), or(eq(n, 95), eq(n, 36)))), _Str_codeAt(0, c));
var isIdChar = (c) => or(isIdStart(c), isDigit(c));
var isNumChar = (c) => or(isDigit(c), eq(c, "."));
var keywordTok = (word) => match(word).with("let", () => Some(TLet)).with("type", () => Some(TType)).with("extern", () => Some(TExtern)).with("switch", () => Some(TSwitch)).with("loop", () => Some(TLoop)).with("recur", () => Some(TRecur)).with("do", () => Some(TDo)).with("import", () => Some(TImport)).with("export", () => Some(TExport)).with("true", () => Some(TBool(true))).with("false", () => Some(TBool(false))).otherwise(() => None);
var identTok = (word) => _Option_unwrapOr(TId(word), keywordTok(word));
var digraphTok = (two) => match(two).with("|>", () => Some(TPipe)).with(">>", () => Some(TCompose)).with("++", () => Some(TConcat)).with("==", () => Some(TEqeq)).with("!=", () => Some(TNeq)).with("<=", () => Some(TLte)).with(">=", () => Some(TGte)).with("&&", () => Some(TAndand)).with("||", () => Some(TOror)).with("=>", () => Some(TArrow)).with("->", () => Some(TTarrow)).otherwise(() => None);
var punctTok = (c) => match(c).with("|", () => Some(TBar)).with("=", () => Some(TEq)).with("(", () => Some(TLparen)).with(")", () => Some(TRparen)).with("{", () => Some(TLbrace)).with("}", () => Some(TRbrace)).with("[", () => Some(TLbracket)).with("]", () => Some(TRbracket)).with(",", () => Some(TComma)).with(";", () => Some(TSemi)).with(".", () => Some(TDot)).with(":", () => Some(TColon)).with("?", () => Some(TQuestion)).with("@", () => Some(TAt)).with("#", () => Some(THash)).with("~", () => Some(TTilde)).with("+", () => Some(TPlus)).with("-", () => Some(TMinus)).with("*", () => Some(TStar)).with("/", () => Some(TSlash)).with("%", () => Some(TPercent)).with("!", () => Some(TBang)).with("`", () => Some(TBacktick)).with("<", () => Some(TLt)).with(">", () => Some(TGt)).otherwise(() => None);
var scanWhile = _curry(3, (pred, src, j) => match(_Str_get(j, src)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: c }) => pred(c))(_g);
}, ({ value: c }) => scanWhile(pred, src, j + 1)).otherwise(() => j));
var escChar = (n) => match(n).with("n", () => `
`).with("t", () => "\t").otherwise((c) => c);
var PLit = (value) => ({ _tag: "PLit", value });
var PHole = _curry(2, (start, end) => ({ _tag: "PHole", start, end }));
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
var literalTok = _curry(3, (idx, total, value) => eq(total, 1) ? TStr(value) : eq(idx, 0) ? TTmplStart(value) : eq(idx, total - 1) ? TTmplEnd(value) : TTmplMid(value));
var scanTemplateLoop = _curry(4, (src, j0, value0, parts0) => {
  let j = j0;
  let value = value0;
  let parts = parts0;
  while (true) {
    const _step = match(_Str_get(j, src)).with({ _tag: "None" }, () => _done(None)).with({ _tag: "Some", value: '"' }, () => _done(Some({ parts: _Array_append(PLit(value), parts), end: j + 1 }))).with({ _tag: "Some", value: "\\" }, () => match(_Str_get(j + 1, src)).with({ _tag: "Some" }, ({ value: n }) => _recur(j + 2, `${value}${escChar(n)}`, parts)).with({ _tag: "None" }, () => _recur(j + 1, `${value}\\`, parts)).exhaustive()).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "$" && _Option_contains("{", _Str_get(j + 1, src));
    }, () => match(findHoleEnd(src, j + 2)).with({ _tag: "None" }, () => _done(None)).with({ _tag: "Some" }, ({ value: holeEnd }) => ((withLit) => ((withHole) => _recur(holeEnd, "", withHole))(_Array_append(PHole(j + 2, holeEnd - 1), withLit)))(_Array_append(PLit(value), parts))).exhaustive()).with({ _tag: "Some" }, ({ value: c }) => _recur(j + 1, `${value}${c}`, parts)).exhaustive();
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var scanTemplate = _curry(2, (src, i) => scanTemplateLoop(src, i + 1, "", []));
var notNewline = (c) => not(eq(c, `
`));
var scanComment = _curry(3, (src, start, lineTok) => {
  const stop = scanWhile(notNewline, src, start);
  return lineTok ? Trailing(stop) : _Option_contains("/", _Str_get(start + 2, src)) ? ((textStart) => DocLine(_Str_slice(textStart, stop, src), stop))(_Option_contains(" ", _Str_get(start + 3, src)) ? start + 4 : start + 3) : PlainOwn(stop);
});
var mkTok = _curry(4, (tok, start, stop, doc) => match(doc).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => ({ tok, start, end: stop, doc: None })).otherwise((lines) => ({ tok, start, end: stop, doc: Some(_Str_join(`
`, lines)) })));
var lexError = _curry(3, (message, start, stop) => Err({ message, start, end: stop }));
var numValue = (raw) => _Option_unwrapOr(0 / 0, _Str_toNumber(raw));
var numStart = _curry(3, (src, i, c) => or(isDigit(c), and(eq(c, "-"), _Option_exists(isDigit, _Str_get(i + 1, src)))));
var offsetLocTok = _curry(2, (lt2, by) => ({ tok: lt2.tok, start: lt2.start + by, end: lt2.end + by, doc: lt2.doc }));
var spliceHoleToks = _curry(3, (holeToks, by, toks) => match(_Array_head(holeToks)).with({ _tag: "None" }, () => toks).with({ _tag: "Some" }, ({ value: ht }) => ((toks2) => spliceHoleToks(_Array_tail(holeToks), by, toks2))(eq(ht.tok, TEof) ? toks : _Array_append(offsetLocTok(ht, by), toks))).exhaustive());
var spliceHole = _curry(4, (src, start, stop, toks) => match(lex(_Str_slice(start, stop, src))).with({ _tag: "Ok" }, ({ value: holeToks }) => Ok(spliceHoleToks(holeToks, start, toks))).with({ _tag: "Err" }, ({ error: e }) => Err({ message: e.message, start: e.start + start, end: e.end + start })).exhaustive());
var lexParts = _curry(8, (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => match(_Array_head(parts)).with({ _tag: "None" }, () => Ok(toks)).with({ _tag: "Some" }, ({ value: part }) => match(part).with({ _tag: "PLit" }, ({ value }) => ((t) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, [], _Array_append(t, toks)))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc))).with({ _tag: "PHole" }, ({ start: hs, end: he }) => match(spliceHole(src, hs, he, toks)).with({ _tag: "Err" }, ({ error: e }) => Err(e)).with({ _tag: "Ok" }, ({ value: toks2 }) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, doc, toks2)).exhaustive()).exhaustive()).exhaustive());
var emit = _curry(6, (src, tok, start, stop, doc, toks) => go(src, stop, [], 0, true, _Array_append(mkTok(tok, start, stop, doc), toks)));
var lexString = _curry(4, (src, i, doc, toks) => match(scanTemplate(src, i)).with({ _tag: "None" }, () => lexError("unterminated string literal", i, _Str_length(src))).with({ _tag: "Some" }, ({ value: scanned }) => match(lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks)).with({ _tag: "Err" }, ({ error: e }) => Err(e)).with({ _tag: "Ok" }, ({ value: toks2 }) => go(src, scanned.end, [], 0, true, toks2)).exhaustive()).exhaustive());
var go = _curry(6, (src, i, doc, nlRun, lineTok, toks) => match(_Str_get(i, src)).with({ _tag: "None" }, () => Ok(_Array_append(mkTok(TEof, i, i, doc), toks))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: c }) => isSpace(c))(_g);
}, ({ value: c }) => eq(c, `
`) ? ((n) => ((kept) => go(src, i + 1, kept, n, false, toks))(n < 2 ? doc : []))(nlRun + 1) : go(src, i + 1, doc, nlRun, lineTok, toks)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value === "/" && _Option_contains("/", _Str_get(i + 1, src));
}, () => match(scanComment(src, i, lineTok)).with({ _tag: "Trailing" }, ({ stop }) => go(src, stop, doc, nlRun, lineTok, toks)).with({ _tag: "PlainOwn" }, ({ stop }) => go(src, stop, [], 0, lineTok, toks)).with({ _tag: "DocLine" }, ({ text, stop }) => go(src, stop, _Array_append(text, doc), 0, lineTok, toks)).exhaustive()).with({ _tag: "Some" }, ({ value: c }) => eq(_Str_slice(i, i + 3, src), "...") ? emit(src, TSpread, i, i + 3, doc, toks) : match(digraphTok(_Str_slice(i, i + 2, src))).with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, i + 2, doc, toks)).with({ _tag: "None" }, () => eq(c, '"') ? lexString(src, i, doc, toks) : numStart(src, i, c) ? ((j) => ((raw) => emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(_Str_slice(i, j, src)))(scanWhile(isNumChar, src, i + 1)) : match(punctTok(c)).with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, i + 1, doc, toks)).with({ _tag: "None" }, () => isIdStart(c) ? ((j) => emit(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(scanWhile(isIdChar, src, i + 1)) : lexError(`unexpected char '${c}'`, i, i + 1)).exhaustive()).exhaustive()).exhaustive());
var lex = (src) => go(src, 0, [], 0, false, []);

import { Err as Err5, None as None5, Ok as Ok5, Some as Some5, _Array_append as _Array_append5, _Array_concat as _Array_concat2, _Array_get as _Array_get4, _Array_prepend as _Array_prepend2, _Option_exists as _Option_exists3, _Option_unwrapOr as _Option_unwrapOr3, _Result_flatMap as _Result_flatMap3, _Result_map as _Result_map3, _Str_codeAt as _Str_codeAt3, _curry as _curry6, _done as _done2, _recur as _recur2, _tuple as _tuple3, and as and4, eq as eq5, length as length5, map as map3, not as not3, or as or4, show as show2 } from "@mochi/compiler/runtime";
import { match as match5 } from "@onrails/pattern";

import { _curry as _curry2 } from "@mochi/compiler/runtime";
var LPName = _curry2(2, (name, annot) => ({ _tag: "LPName", name, annot }));
var LPRecord = (fields) => ({ _tag: "LPRecord", fields });
var LPTuple = (names) => ({ _tag: "LPTuple", names });
var LPLabeled = _curry2(4, (name, annot, optional, defaultValue) => ({ _tag: "LPLabeled", name, annot, optional, defaultValue }));
var LPSpanned = _curry2(2, (param, nameSpans) => ({ _tag: "LPSpanned", param, nameSpans }));
var SEExpr = (expr) => ({ _tag: "SEExpr", expr });
var SESpread = (expr) => ({ _tag: "SESpread", expr });
var ENum = _curry2(3, (value, raw, span) => ({ _tag: "ENum", value, raw, span }));
var EUnit = (span) => ({ _tag: "EUnit", span });
var EBool = _curry2(2, (value, span) => ({ _tag: "EBool", value, span }));
var EStr = _curry2(2, (value, span) => ({ _tag: "EStr", value, span }));
var ERef = _curry2(2, (name, span) => ({ _tag: "ERef", name, span }));
var ECall = _curry2(4, (fn, args, origin, span) => ({ _tag: "ECall", fn, args, origin, span }));
var ELambda = _curry2(3, (params, body, span) => ({ _tag: "ELambda", params, body, span }));
var ELetIn = _curry2(5, (name, nameSpan, value, body, span) => ({ _tag: "ELetIn", name, nameSpan, value, body, span }));
var ELetBind = _curry2(6, (param, paramSpan, monad, value, body, span) => ({ _tag: "ELetBind", param, paramSpan, monad, value, body, span }));
var EPipe = _curry2(4, (left, right, fast, span) => ({ _tag: "EPipe", left, right, fast, span }));
var EDo = _curry2(2, (exprs, span) => ({ _tag: "EDo", exprs, span }));
var ETernary = _curry2(4, (cond, thenE, elseE, span) => ({ _tag: "ETernary", cond, thenE, elseE, span }));
var EMatch = _curry2(3, (scrutinee, arms, span) => ({ _tag: "EMatch", scrutinee, arms, span }));
var ERecord = _curry2(3, (fields, spread, span) => ({ _tag: "ERecord", fields, spread, span }));
var EField = _curry2(4, (target, name, optional, span) => ({ _tag: "EField", target, name, optional, span }));
var ETuple = _curry2(2, (elements, span) => ({ _tag: "ETuple", elements, span }));
var EArr = _curry2(2, (elements, span) => ({ _tag: "EArr", elements, span }));
var EList = _curry2(2, (elements, span) => ({ _tag: "EList", elements, span }));
var ESet = _curry2(2, (elements, span) => ({ _tag: "ESet", elements, span }));
var EMap = _curry2(2, (entries, span) => ({ _tag: "EMap", entries, span }));
var ELoop = _curry2(3, (params, body, span) => ({ _tag: "ELoop", params, body, span }));
var ERecur = _curry2(2, (args, span) => ({ _tag: "ERecur", args, span }));
var EInterp = _curry2(2, (parts, span) => ({ _tag: "EInterp", parts, span }));
var IPLit = (value) => ({ _tag: "IPLit", value });
var IPExpr = (expr) => ({ _tag: "IPExpr", expr });
var PWild = (span) => ({ _tag: "PWild", span });
var PUnit = (span) => ({ _tag: "PUnit", span });
var PBind = _curry2(2, (name, span) => ({ _tag: "PBind", name, span }));
var PAs = _curry2(4, (pat, name, nameSpan, span) => ({ _tag: "PAs", pat, name, nameSpan, span }));
var PLit2 = _curry2(3, (value, raw, span) => ({ _tag: "PLit", value, raw, span }));
var PBool = _curry2(2, (value, span) => ({ _tag: "PBool", value, span }));
var PStr = _curry2(2, (value, span) => ({ _tag: "PStr", value, span }));
var PTuple = _curry2(2, (elems, span) => ({ _tag: "PTuple", elems, span }));
var PRecord = _curry2(2, (fields, span) => ({ _tag: "PRecord", fields, span }));
var PCtor = _curry2(4, (ctor, args, ns, span) => ({ _tag: "PCtor", ctor, args, ns, span }));
var PArr = _curry2(3, (elems, rest, span) => ({ _tag: "PArr", elems, rest, span }));
var PList = _curry2(3, (elems, rest, span) => ({ _tag: "PList", elems, rest, span }));
var POr = _curry2(2, (alts, span) => ({ _tag: "POr", alts, span }));
var TyName = _curry2(2, (name, span) => ({ _tag: "TyName", name, span }));
var TyArrow = _curry2(3, (from, to, span) => ({ _tag: "TyArrow", from, to, span }));
var TyApp = _curry2(3, (ctor, args, span) => ({ _tag: "TyApp", ctor, args, span }));
var TyTuple = _curry2(2, (elems, span) => ({ _tag: "TyTuple", elems, span }));
var TyList = _curry2(2, (elem, span) => ({ _tag: "TyList", elem, span }));
var TyQual = _curry2(5, (alias, name, nameSpan, args, span) => ({ _tag: "TyQual", alias, name, nameSpan, args, span }));
var TyLit = _curry2(2, (value, span) => ({ _tag: "TyLit", value, span }));
var TyUnion = _curry2(2, (members, span) => ({ _tag: "TyUnion", members, span }));
var SLet = _curry2(7, (name, nameSpan, annot, value, exported, doc, span) => ({ _tag: "SLet", name, nameSpan, annot, value, exported, doc, span }));
var SType = _curry2(8, (name, params, ctors, alias, aliasType, exported, doc, span) => ({ _tag: "SType", name, params, ctors, alias, aliasType, exported, doc, span }));
var SExtern = _curry2(10, (name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span) => ({ _tag: "SExtern", name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }));
var SImport = _curry2(3, (names, from, span) => ({ _tag: "SImport", names, from, span }));
var SImportNs = _curry2(3, (alias, from, span) => ({ _tag: "SImportNs", alias, from, span }));
var SExpr = _curry2(2, (value, span) => ({ _tag: "SExpr", value, span }));
var SError = (span) => ({ _tag: "SError", span });

import { Err as Err4, None as None4, Ok as Ok4, Some as Some4, _Array_append as _Array_append4, _Array_concat, _Array_get as _Array_get3, _curry as _curry5, eq as eq4, length as length4 } from "@mochi/compiler/runtime";
import { match as match4 } from "@onrails/pattern";

import { Err as Err3, None as None3, Ok as Ok3, Some as Some3, _Array_append as _Array_append3, _Array_get as _Array_get2, _Map_get as _Map_get2, _Option_exists as _Option_exists2, _Option_flatMap, _Option_unwrapOr as _Option_unwrapOr2, _Result_flatMap as _Result_flatMap2, _Result_map as _Result_map2, _Str_codeAt as _Str_codeAt2, _Str_length as _Str_length2, _Str_slice as _Str_slice2, _Str_split, _Str_startsWith, _curry as _curry4, _tuple as _tuple2, and as and3, eq as eq3, length as length3, map as map2, or as or3 } from "@mochi/compiler/runtime";
import { match as match3 } from "@onrails/pattern";

import { Err as Err2, None as None2, Ok as Ok2, Some as Some2, _Array_append as _Array_append2, _Array_get, _Array_prepend, _Map_get, _Map_keys, _Map_set, _Result_flatMap, _Result_map, _Str_join as _Str_join2, _curry as _curry3, _tuple, and as and2, eq as eq2, length as length2, map, not as not2, or as or2, show } from "@mochi/compiler/runtime";
import { match as match2 } from "@onrails/pattern";
var TyVar = (id) => ({ _tag: "TyVar", id });
var TyCon = _curry3(2, (name, args) => ({ _tag: "TyCon", name, args }));
var TyFn = _curry3(2, (from, to) => ({ _tag: "TyFn", from, to }));
var TyRecord = (row) => ({ _tag: "TyRecord", row });
var TySingleton = _curry3(2, (base, value) => ({ _tag: "TySingleton", base, value }));
var TyOneOf = (members) => ({ _tag: "TyOneOf", members });
var RowEmpty = { _tag: "RowEmpty" };
var RowVar = (id) => ({ _tag: "RowVar", id });
var RowExtend = _curry3(4, (label, fieldType, optional, rest) => ({ _tag: "RowExtend", label, fieldType, optional, rest }));
var tVar = (id) => TyVar(id);
var tCon = _curry3(2, (name, args) => TyCon(name, args));
var tArrow = _curry3(2, (fromT, toT) => TyFn(fromT, toT));
var tRecord = (row) => TyRecord(row);
var tPrim = (name) => TyCon(name, []);
var tLit = (value) => TySingleton("string", value);
var typeEq = _curry3(2, (a, b) => match2(a).with({ _tag: "TyVar" }, ({ id: aid }) => match2(b).with({ _tag: "TyVar" }, ({ id: bid }) => eq2(aid, bid)).otherwise(() => false)).with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match2(b).with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => and2(and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))), typeEqList(aargs, bargs, 0))).otherwise(() => false)).with({ _tag: "TyFn" }, ({ from: af, to: at }) => match2(b).with({ _tag: "TyFn" }, ({ from: bf, to: bt }) => and2(typeEq(af, bf), typeEq(at, bt))).otherwise(() => false)).with({ _tag: "TyRecord" }, ({ row: arow }) => match2(b).with({ _tag: "TyRecord" }, ({ row: brow }) => rowEq(arow, brow)).otherwise(() => false)).with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match2(b).with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => and2(eq2(abase, bbase), eq2(aval, bval))).otherwise(() => false)).with({ _tag: "TyOneOf" }, ({ members: am }) => match2(b).with({ _tag: "TyOneOf" }, ({ members: bm }) => and2(eq2(length2(am), length2(bm)), allMembersIn(am, bm, 0))).otherwise(() => false)).exhaustive());
var typeEqList = _curry3(3, (as_, bs, i) => match2(_Array_get(i, as_)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: a }) => match2(_Array_get(i, bs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: b }) => and2(typeEq(a, b), typeEqList(as_, bs, i + 1))).exhaustive()).exhaustive());
var memberEqIn = _curry3(3, (t, xs, i) => match2(_Array_get(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => typeEq(t, x) ? true : memberEqIn(t, xs, i + 1)).exhaustive());
var allMembersIn = _curry3(3, (am, bm, i) => match2(_Array_get(i, am)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: m }) => and2(memberEqIn(m, bm, 0), allMembersIn(am, bm, i + 1))).exhaustive());
var rowEq = _curry3(2, (a, b) => match2(a).with({ _tag: "RowEmpty" }, () => match2(b).with({ _tag: "RowEmpty" }, () => true).otherwise(() => false)).with({ _tag: "RowVar" }, ({ id: aid }) => match2(b).with({ _tag: "RowVar" }, ({ id: bid }) => eq2(aid, bid)).otherwise(() => false)).with({ _tag: "RowExtend" }, ({ label: al, fieldType: at, optional: ao, rest: ar }) => match2(b).with({ _tag: "RowExtend" }, ({ label: bl, fieldType: bt, optional: bo, rest: br }) => and2(and2(and2(eq2(al, bl), eq2(ao, bo)), typeEq(at, bt)), rowEq(ar, br))).otherwise(() => false)).exhaustive());
var flattenUnionFrom = _curry3(3, (members, acc, i) => match2(_Array_get(i, members)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: t }) => match2(t).with({ _tag: "TyOneOf" }, ({ members: ms }) => flattenUnionFrom(members, flattenUnionFrom(ms, acc, 0), i + 1)).otherwise(() => flattenUnionFrom(members, memberEqIn(t, acc, 0) ? acc : _Array_append2(t, acc), i + 1))).exhaustive());
var tUnion = (members) => {
  const flat = flattenUnionFrom(members, [], 0);
  return match2(flat).with((_v) => {
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
var isUnit = (t) => match2(t).with({ _tag: "TyCon" }, ({ name, args }) => and2(eq2(name, UNIT), eq2(length2(args), 0))).otherwise(() => false);
var rVar = (id) => RowVar(id);
var rExtend = _curry3(3, (label, fieldType, rest) => RowExtend(label, fieldType, false, rest));
var rField = _curry3(4, (label, fieldType, rest, optional) => RowExtend(label, fieldType, optional, rest));
var showTypeArgs = (args) => _Str_join2(", ", map(showType, args));
var showType = (t) => match2(t).with({ _tag: "TyVar" }, ({ id }) => `'t${show(id)}`).with({ _tag: "TyCon" }, ({ name, args }) => match2(args).with((_v) => {
  const _g = _v;
  return _g.length === 1 && (([elem]) => eq2(name, "Array"))(_g);
}, ([elem]) => `[${showType(elem)}]`).with((_v) => {
  const _g = _v;
  return _g.length === 0 && eq2(name, UNIT);
}, () => "()").otherwise(() => eq2(name, TUPLE) ? `(${showTypeArgs(args)})` : eq2(length2(args), 0) ? name : `${name}<${showTypeArgs(args)}>`)).with({ _tag: "TyFn" }, ({ from, to }) => ((fromS) => `${fromS} -> ${showType(to)}`)(match2(from).with({ _tag: "TyFn" }, () => `(${showType(from)})`).otherwise(() => showType(from)))).with({ _tag: "TyRecord" }, ({ row }) => showRow(row)).with({ _tag: "TySingleton" }, ({ base, value }) => eq2(base, "string") ? show(value) : value).with({ _tag: "TyOneOf" }, ({ members }) => _Str_join2(" | ", map(showType, members))).exhaustive();
var showRowFields = (row) => match2(row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => (([fields, tailId]) => _tuple(_Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields), tailId))(showRowFields(rest))).with({ _tag: "RowVar" }, ({ id }) => _tuple([], Some2(id))).with({ _tag: "RowEmpty" }, () => _tuple([], None2)).exhaustive();
var showRow = (row) => (([fields, tailId]) => {
  const tail = match2(tailId).with({ _tag: "Some" }, ({ value: id }) => `${eq2(length2(fields), 0) ? "" : " "}| 'r${show(id)}`).with({ _tag: "None" }, () => "").exhaustive();
  return and2(eq2(length2(fields), 0), eq2(tail, "")) ? "{}" : `{ ${_Str_join2(", ", fields)}${tail} }`;
})(showRowFields(row));
var someOfFrom = _curry3(3, (f, xs, i) => match2(_Array_get(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => f(x) ? true : someOfFrom(f, xs, i + 1)).exhaustive());
var someOf = _curry3(2, (f, xs) => someOfFrom(f, xs, 0));
var mkSt = (start) => ({ tv: new Map, rv: new Map, next: start, recorded: [], letSpans: new Map, letUses: new Map });
var recordAt = _curry3(3, (span, t, st) => ({ ...st, recorded: _Array_prepend({ span, ty: t }, st.recorded) }));
var spanKeyOf = (sp) => `${show(sp.start)}:${show(sp.end)}`;
var noteLet = _curry3(2, (span, st) => {
  const k = spanKeyOf(span);
  return { ...st, letSpans: _Map_set(k, span, st.letSpans), letUses: _Map_set(k, [], st.letUses) };
});
var noteUse = _curry3(3, (span, t, st) => {
  const k = spanKeyOf(span);
  return match2(_Map_get(k, st.letUses)).with({ _tag: "None" }, () => st).with({ _tag: "Some" }, ({ value: uses }) => ({ ...st, letUses: _Map_set(k, _Array_append2(t, uses), st.letUses) })).exhaustive();
});
var fail = (message) => Err2({ message });
var freshVar = (st) => _tuple(tVar(st.next), { ...st, next: st.next + 1 });
var freshRowVar = (st) => _tuple(rVar(st.next), { ...st, next: st.next + 1 });
var resolve = _curry3(2, (t, st) => match2(t).with({ _tag: "TyVar" }, ({ id }) => match2(_Map_get(id, st.tv)).with({ _tag: "Some" }, ({ value: next }) => resolve(next, st)).with({ _tag: "None" }, () => t).exhaustive()).otherwise(() => t));
var resolveRow = _curry3(2, (r, st) => match2(r).with({ _tag: "RowVar" }, ({ id }) => match2(_Map_get(id, st.rv)).with({ _tag: "Some" }, ({ value: next }) => resolveRow(next, st)).with({ _tag: "None" }, () => r).exhaustive()).otherwise(() => r));
var zonk = _curry3(2, (t, st) => match2(resolve(t, st)).with({ _tag: "TyVar" }, ({ id }) => tVar(id)).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map((a) => zonk(a, st), args))).with({ _tag: "TyFn" }, ({ from, to }) => tArrow(zonk(from, st), zonk(to, st))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(zonkRow(row, st))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m) => zonk(m, st), members))).exhaustive());
var zonkRow = _curry3(2, (row, st) => match2(resolveRow(row, st)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, zonk(fieldType, st), zonkRow(rest, st), optional)).otherwise((r) => r));
var occurs = _curry3(3, (id, t, st) => match2(resolve(t, st)).with({ _tag: "TyVar" }, ({ id: rid }) => eq2(rid, id)).with({ _tag: "TyCon" }, ({ args }) => someOf((a) => occurs(id, a, st), args)).with({ _tag: "TyFn" }, ({ from, to }) => or2(occurs(id, from, st), occurs(id, to, st))).with({ _tag: "TyRecord" }, ({ row }) => occursRow(id, row, st)).with({ _tag: "TySingleton" }, () => false).with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => occurs(id, m, st), members)).exhaustive());
var occursRow = _curry3(3, (id, row, st) => match2(resolveRow(row, st)).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or2(occurs(id, fieldType, st), occursRow(id, rest, st))).otherwise(() => false));
var rowVarOccurs = _curry3(3, (id, row, st) => match2(resolveRow(row, st)).with({ _tag: "RowVar" }, ({ id: rid }) => eq2(rid, id)).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or2(rowVarOccursInType(id, fieldType, st), rowVarOccurs(id, rest, st))).with({ _tag: "RowEmpty" }, () => false).exhaustive());
var rowVarOccursInType = _curry3(3, (id, t, st) => match2(resolve(t, st)).with({ _tag: "TyVar" }, () => false).with({ _tag: "TyCon" }, ({ args }) => someOf((a) => rowVarOccursInType(id, a, st), args)).with({ _tag: "TyFn" }, ({ from, to }) => or2(rowVarOccursInType(id, from, st), rowVarOccursInType(id, to, st))).with({ _tag: "TyRecord" }, ({ row }) => rowVarOccurs(id, row, st)).with({ _tag: "TySingleton" }, () => false).with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => rowVarOccursInType(id, m, st), members)).exhaustive());
var isArrowT = (t) => match2(t).with({ _tag: "TyFn" }, () => true).otherwise(() => false);
var isCollection = (name) => or2(or2(or2(eq2(name, "Array"), eq2(name, "List")), eq2(name, "Set")), eq2(name, "Map"));
var isTupleT = (t) => match2(t).with({ _tag: "TyCon" }, ({ name }) => eq2(name, TUPLE)).otherwise(() => false);
var tupleParenMsg = _curry3(3, (a, b, shown) => not2(eq2(isTupleT(a), isTupleT(b))) ? `${shown} \u2014 ((a, b)) => takes one tuple; (a, b) => takes two arguments` : shown);
var collectionUnifyMsg = _curry3(3, (aname, bname, shown) => or2(or2(eq2(aname, bname), not2(isCollection(aname))), not2(isCollection(bname))) ? shown : ((other) => ((hint) => `${shown} \u2014 ${hint}`)(eq2(other, "List") ? "unqualified map/filter/length expect Array; use List.map" : eq2(other, "Set") ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*" : eq2(other, "Map") ? "unqualified map/filter/length expect Array; use Map.*" : `${aname} and ${bname} are distinct collections`))(eq2(aname, "Array") ? bname : eq2(bname, "Array") ? aname : ""));
var unifyMismatch = _curry3(2, (ra, rb) => not2(eq2(isArrowT(ra), isArrowT(rb))) ? (([fn, val]) => fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)} \u2014 a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`)))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra)) : fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)));
var unifyArgs = _curry3(4, (as_, bs, i, st) => match2(_Array_get(i, as_)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: a }) => match2(_Array_get(i, bs)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: b }) => _Result_flatMap((s1) => unifyArgs(as_, bs, i + 1, s1), unify(a, b, st))).exhaustive()).exhaustive());
var isPrimT = _curry3(2, (t, name) => match2(t).with({ _tag: "TyCon" }, ({ name: n, args }) => and2(eq2(n, name), eq2(length2(args), 0))).otherwise(() => false));
var isLitOnlyUnion = (members) => match2(members).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "TySingleton";
}, ([, ...rest]) => isLitOnlyUnion(rest)).otherwise(() => false);
var widenLitBindingsFrom = _curry3(3, (ids, lit, st) => match2(ids).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => st).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([id, ...rest]) => match2(_Map_get(id, st.tv)).with({ _tag: "Some" }, ({ value: t }) => match2(resolve(t, st)).with({ _tag: "TySingleton" }, ({ base, value }) => match2(lit).with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => and2(eq2(base, lbase), eq2(value, lvalue)) ? widenLitBindingsFrom(rest, lit, { ...st, tv: _Map_set(id, tPrim(base), st.tv) }) : widenLitBindingsFrom(rest, lit, st)).otherwise(() => widenLitBindingsFrom(rest, lit, st))).otherwise(() => widenLitBindingsFrom(rest, lit, st))).with({ _tag: "None" }, () => widenLitBindingsFrom(rest, lit, st)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var widenLitBindings = _curry3(2, (lit, st) => widenLitBindingsFrom(_Map_keys(st.tv), lit, st));
var litInUnionFrom = _curry3(4, (lit, members, i, st) => match2(_Array_get(i, members)).with({ _tag: "None" }, () => fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`)).with({ _tag: "Some" }, ({ value: m }) => match2(m).with({ _tag: "TySingleton" }, ({ base, value }) => match2(lit).with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => and2(eq2(base, lbase), eq2(value, lvalue)) ? Ok2(st) : litInUnionFrom(lit, members, i + 1, st)).otherwise(() => litInUnionFrom(lit, members, i + 1, st))).otherwise(() => match2(unify(lit, m, st)).with({ _tag: "Ok" }, ({ value: st1 }) => Ok2(st1)).with({ _tag: "Err" }, () => litInUnionFrom(lit, members, i + 1, st)).exhaustive())).exhaustive());
var unifyMemberAgainstUnionFrom = _curry3(4, (member, members, i, st) => match2(member).with({ _tag: "TySingleton" }, () => litInUnionFrom(member, members, 0, st)).otherwise(() => unifyConcreteAgainstUnionFrom(member, members, i, st)));
var unifyConcreteAgainstUnionFrom = _curry3(4, (member, members, i, st) => match2(_Array_get(i, members)).with({ _tag: "None" }, () => fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`)).with({ _tag: "Some" }, ({ value: m }) => match2(unify(member, m, st)).with({ _tag: "Ok" }, ({ value: st1 }) => Ok2(st1)).with({ _tag: "Err" }, () => unifyConcreteAgainstUnionFrom(member, members, i + 1, st)).exhaustive()).exhaustive());
var unifyUnionMembersFrom = _curry3(4, (members, u, i, st) => match2(_Array_get(i, members)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: m }) => match2(u).with({ _tag: "TyOneOf" }, ({ members: ums }) => _Result_flatMap((s1) => unifyUnionMembersFrom(members, u, i + 1, s1), unifyMemberAgainstUnionFrom(m, ums, 0, st))).otherwise(() => Ok2(st))).exhaustive());
var unifyLitUnion = _curry3(3, (a, b, st) => match2(a).with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match2(b).with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => and2(eq2(abase, bbase), eq2(aval, bval)) ? Ok2(st) : eq2(abase, bbase) ? Ok2(widenLitBindings(b, widenLitBindings(a, st))) : fail(`cannot unify ${showType(a)} with ${showType(b)}`)).with({ _tag: "TyOneOf" }, ({ members }) => litInUnionFrom(a, members, 0, st)).otherwise(() => isPrimT(b, abase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))).with({ _tag: "TyOneOf" }, ({ members: amembers }) => match2(b).with({ _tag: "TySingleton" }, () => litInUnionFrom(b, amembers, 0, st)).with({ _tag: "TyOneOf" }, ({ members: bmembers }) => _Result_flatMap((s1) => unifyUnionMembersFrom(bmembers, a, 0, s1), unifyUnionMembersFrom(amembers, b, 0, st))).otherwise(() => isLitOnlyUnion(amembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(b, amembers, 0, st))).otherwise(() => match2(b).with({ _tag: "TySingleton" }, ({ base: bbase }) => isPrimT(a, bbase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`)).with({ _tag: "TyOneOf" }, ({ members: bmembers }) => isLitOnlyUnion(bmembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(a, bmembers, 0, st)).otherwise(() => fail(`cannot unify ${showType(a)} with ${showType(b)}`))));
var unify = _curry3(3, (a, b, st) => {
  const ra = resolve(a, st);
  const rb = resolve(b, st);
  return match2(ra).with({ _tag: "TyVar" }, ({ id: aid }) => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => eq2(aid, bid) ? Ok2(st) : bindVar(aid, rb, st)).otherwise(() => bindVar(aid, rb, st))).with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))) ? unifyArgs(aargs, bargs, 0, st) : fail(tupleParenMsg(ra, rb, collectionUnifyMsg(aname, bname, `cannot unify ${showType(ra)} with ${showType(rb)}`)))).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TyFn" }, ({ from: afrom, to: ato }) => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyFn" }, ({ from: bfrom, to: bto }) => _Result_flatMap((s1) => unify(ato, bto, s1), unify(afrom, bfrom, st))).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TyRecord" }, ({ row: arow }) => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyRecord" }, ({ row: brow }) => unifyRows(arow, brow, st)).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TySingleton" }, () => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).otherwise(() => unifyLitUnion(ra, rb, st))).with({ _tag: "TyOneOf" }, () => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).otherwise(() => unifyLitUnion(ra, rb, st))).exhaustive();
});
var bindVar = _curry3(3, (id, t, st) => occurs(id, t, st) ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk(t, st))}`) : Ok2({ ...st, tv: _Map_set(id, t, st.tv) }));
var rewriteRow = _curry3(3, (row, label, st) => match2(resolveRow(row, st)).with({ _tag: "RowEmpty" }, () => fail(`record missing field '${label}'`)).with({ _tag: "RowExtend" }, ({ label: rlabel, fieldType: rtype, optional: ropt, rest: rrest }) => eq2(rlabel, label) ? Ok2(_tuple(rtype, ropt, rrest, st)) : _Result_map(([subType, subOpt, subRest, subSt]) => _tuple(subType, subOpt, rField(rlabel, rtype, subRest, ropt), subSt), rewriteRow(rrest, label, st))).with({ _tag: "RowVar" }, ({ id: rid }) => (([freshT, st1]) => (([freshTail, st2]) => Ok2(_tuple(freshT, false, freshTail, { ...st2, rv: _Map_set(rid, rExtend(label, freshT, freshTail), st2.rv) })))(freshRowVar(st1)))(freshVar(st))).exhaustive());
var unifyRows = _curry3(3, (r1, r2, st) => {
  const a = resolveRow(r1, st);
  const b = resolveRow(r2, st);
  return match2(a).with({ _tag: "RowEmpty" }, () => match2(b).with({ _tag: "RowEmpty" }, () => Ok2(st)).with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st)).with({ _tag: "RowExtend" }, ({ label }) => fail(`record missing field '${label}'`)).exhaustive()).with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, b, st)).with({ _tag: "RowExtend" }, ({ label: alabel, fieldType: atype, optional: aopt, rest: arest }) => match2(b).with({ _tag: "RowEmpty" }, () => fail(`record has extra field '${alabel}'`)).with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st)).with({ _tag: "RowExtend" }, () => _Result_flatMap(([btype, bopt, brest, s1]) => eq2(aopt, bopt) ? _Result_flatMap((s2) => unifyRows(arest, brest, s2), unify(atype, btype, s1)) : fail(aopt ? `record field '${alabel}' is optional but required on the other side` : `record field '${alabel}' is required but optional on the other side`), rewriteRow(b, alabel, st))).exhaustive()).exhaustive();
});
var bindRowVar = _curry3(3, (id, row, st) => match2(resolveRow(row, st)).with((_v) => {
  const _g = _v;
  return _g._tag === "RowVar" && (({ id: rid }) => eq2(rid, id))(_g);
}, ({ id: rid }) => Ok2(st)).otherwise((r) => rowVarOccurs(id, r, st) ? fail("infinite record type") : Ok2({ ...st, rv: _Map_set(id, r, st.rv) })));
var fits = _curry3(3, (actual, expected, st) => {
  const ra = resolve(actual, st);
  const rb = resolve(expected, st);
  return match2(ra).with({ _tag: "TyVar" }, ({ id: aid }) => bindVar(aid, rb, st)).otherwise(() => match2(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyRecord" }, ({ row: erow }) => match2(ra).with({ _tag: "TyRecord" }, ({ row: arow }) => fitsRows(arow, erow, st)).otherwise(() => unify(actual, expected, st))).otherwise(() => unify(actual, expected, st)));
});
var fitsRows = _curry3(3, (actual, expected, st) => {
  const exp = resolveRow(expected, st);
  const act = resolveRow(actual, st);
  return match2(exp).with({ _tag: "RowVar" }, ({ id: eid }) => bindRowVar(eid, act, st)).with({ _tag: "RowEmpty" }, () => match2(act).with({ _tag: "RowEmpty" }, () => Ok2(st)).with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, exp, st)).with({ _tag: "RowExtend" }, ({ label }) => fail(`record has extra field '${label}'`)).exhaustive()).with({ _tag: "RowExtend" }, ({ label: elabel, fieldType: etype, optional: eopt, rest: erest }) => ((rw) => match2(rw).with({ _tag: "Err" }, () => eopt ? fitsRows(act, erest, st) : fail(`record missing field '${elabel}'`)).with({ _tag: "Ok" }, ({ value: hit }) => (([htype, hopt, hrest, s1]) => and2(hopt, not2(eopt)) ? fail(`record field '${elabel}' is required but missing or optional`) : _Result_flatMap((s2) => fitsRows(hrest, erest, s2), unify(htype, etype, s1)))(hit)).exhaustive())(rewriteRow(act, elabel, st))).exhaustive();
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

var jxTokName = (t) => match3(t).with({ _tag: "TEq" }, () => "eq").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TId" }, () => "id").with({ _tag: "TStr" }, () => "str").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TEof" }, () => "eof").otherwise(() => "tok");
var jxEofTok = { tok: TEof, start: 0, end: 0, doc: None3 };
var jxTokAt = _curry4(2, (toks, i) => _Option_unwrapOr2(jxEofTok, _Array_get2(i, toks)));
var jxSpanOf = (lt3) => ({ start: lt3.start, end: lt3.end });
var jxToEnd = _curry4(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt(toks, pos - 1).end }));
var jxErrAt = _curry4(2, (message, lt3) => Err3({ message, start: lt3.start, end: lt3.end }));
var jxExpectTok = _curry4(3, (t, toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return eq3(lt3.tok, t) ? Ok3(pos + 1) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt3.tok)}`, lt3);
});
var jxExpectId = _curry4(2, (toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return match3(lt3.tok).with({ _tag: "TId" }, ({ value: name }) => Ok3(_tuple2({ name, span: jxSpanOf(lt3) }, pos + 1))).otherwise((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt3));
});
var jxKeywordText = (t) => match3(t).with({ _tag: "TLet" }, () => Some3("let")).with({ _tag: "TType" }, () => Some3("type")).with({ _tag: "TExtern" }, () => Some3("extern")).with({ _tag: "TSwitch" }, () => Some3("switch")).with({ _tag: "TLoop" }, () => Some3("loop")).with({ _tag: "TRecur" }, () => Some3("recur")).with({ _tag: "TDo" }, () => Some3("do")).with({ _tag: "TImport" }, () => Some3("import")).with({ _tag: "TExport" }, () => Some3("export")).otherwise(() => None3);
var jxExpectLabel = _curry4(2, (toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return match3(jxKeywordText(lt3.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok3(_tuple2({ name, span: jxSpanOf(lt3) }, pos + 1))).with({ _tag: "None" }, () => jxExpectId(toks, pos)).exhaustive();
});
var jxAttrNameFrom = _curry4(3, (toks, pos, acc) => {
  const minusTok = jxTokAt(toks, pos);
  const partTok = jxTokAt(toks, pos + 1);
  return and3(and3(eq3(minusTok.tok, TMinus), eq3(minusTok.start, acc.span.end)), eq3(partTok.start, minusTok.end)) ? match3(jxExpectLabel(toks, pos + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [part, p1] }) => jxAttrNameFrom(toks, p1, { name: `${acc.name}-${part.name}`, span: { start: acc.span.start, end: part.span.end } })).with({ _tag: "Err" }, () => _tuple2(acc, pos)).exhaustive() : _tuple2(acc, pos);
});
var jxExpectAttrName = _curry4(2, (toks, pos) => _Result_map2(([head, p1]) => jxAttrNameFrom(toks, p1, head), jxExpectLabel(toks, pos)));
var jxIsUpper = (s) => _Option_exists2((n) => and3(n >= 65, n <= 90), _Str_codeAt2(0, s));
var jxExprSpan = (e) => match3(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var makeJsxCall = _curry4(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => {
  const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos);
  const pragmaRef = ERef("h", jxSpanOf(startTok));
  const propsRecord = ERecord(fields, spreadOpt, fullSpan);
  const childrenArr = EArr(children, fullSpan);
  return ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some3("jsx"), fullSpan);
});
var parseJsxAttributes = _curry4(5, (toks, pos, fieldsAcc, spreadAcc, parseExpr) => {
  const tk = jxTokAt(toks, pos).tok;
  const nxt = jxTokAt(toks, pos + 1).tok;
  return or3(eq3(tk, TGt), and3(eq3(tk, TSlash), eq3(nxt, TGt))) ? Ok3(_tuple2(fieldsAcc, spreadAcc, pos)) : eq3(tk, TLbrace) ? _Result_flatMap2((p1) => _Result_flatMap2(([spExpr, p2]) => _Result_flatMap2((p3) => parseJsxAttributes(toks, p3, fieldsAcc, Some3(spExpr), parseExpr), jxExpectTok(TRbrace, toks, p2)), parseExpr(toks, p1)), jxExpectTok(TSpread, toks, pos + 1)) : _Result_flatMap2(([attrId, p1]) => (([valExpr, p2]) => {
    const field = { name: attrId.name, value: valExpr };
    return parseJsxAttributes(toks, p2, _Array_append3(field, fieldsAcc), spreadAcc, parseExpr);
  })(eq3(jxTokAt(toks, p1).tok, TEq) ? ((pEq) => match3(jxTokAt(toks, pEq).tok).with({ _tag: "TStr" }, ({ value: v }) => _tuple2(EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1)).with({ _tag: "TLbrace" }, () => match3(parseExpr(toks, pEq + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [e, pR] }) => _tuple2(e, pR + 1)).with({ _tag: "Err" }, () => _tuple2(EBool(true, attrId.span), pEq)).exhaustive()).otherwise(() => _tuple2(EBool(true, attrId.span), pEq)))(p1 + 1) : _tuple2(EBool(true, attrId.span), p1)), jxExpectAttrName(toks, pos));
});
var parseJsxChildren = _curry4(5, (expectedTag, toks, pos, acc, parseExpr) => {
  const lt3 = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq3(lt3.tok, TEof) ? jxErrAt(eq3(expectedTag, "") ? "unclosed JSX fragment" : "unclosed JSX tag", lt3) : and3(eq3(lt3.tok, TLt), eq3(nxt.tok, TSlash)) ? eq3(expectedTag, "") ? _Result_flatMap2((p1) => Ok3(_tuple2(acc, p1)), jxExpectTok(TGt, toks, pos + 2)) : _Result_flatMap2(([closingId, p1]) => _Result_flatMap2((p2) => eq3(closingId.name, expectedTag) ? Ok3(_tuple2(acc, p2)) : jxErrAt("mismatched JSX closing tag", lt3), jxExpectTok(TGt, toks, p1)), jxExpectId(toks, pos + 2)) : eq3(lt3.tok, TLt) ? _Result_flatMap2(([childJsx, p1]) => parseJsxChildren(expectedTag, toks, p1, _Array_append3(SEExpr(childJsx), acc), parseExpr), parseJsx(toks, pos, parseExpr)) : eq3(lt3.tok, TLbrace) ? eq3(nxt.tok, TSpread) ? _Result_flatMap2(([spChild, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append3(SESpread(spChild), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 2)) : _Result_flatMap2(([childExpr, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append3(SEExpr(childExpr), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 1)) : match3(lt3.tok).with({ _tag: "TStr" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EStr(v, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TNum" }, ({ value: v, raw }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(ENum(v, raw, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TBool" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EBool(v, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TId" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EStr(v, jxSpanOf(lt3))), acc), parseExpr)).otherwise(() => jxErrAt("unexpected token in JSX children", lt3));
});
var parseJsx = _curry4(3, (toks, pos, parseExpr) => {
  const startTok = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq3(nxt.tok, TGt) ? _Result_flatMap2(([children, p1]) => Ok3(_tuple2(makeJsxCall(EStr("Fragment", jxSpanOf(startTok)), [], None3, children, startTok, toks, p1), p1)), parseJsxChildren("", toks, pos + 2, [], parseExpr)) : _Result_flatMap2(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap2(([fields, spreadOpt, p2]) => {
    const isSelfClosing = eq3(jxTokAt(toks, p2).tok, TSlash);
    return _Result_flatMap2((p3) => isSelfClosing ? Ok3(_tuple2(makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3)) : _Result_flatMap2(([children, p4]) => Ok3(_tuple2(makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4)), parseJsxChildren(tagNameStr, toks, p3, [], parseExpr)), isSelfClosing ? jxExpectTok(TGt, toks, p2 + 1) : jxExpectTok(TGt, toks, p2));
  }, parseJsxAttributes(toks, p1, [], None3, parseExpr)))(firstId.name))(jxIsUpper(firstId.name) ? ERef(firstId.name, firstId.span) : EStr(firstId.name, firstId.span)), jxExpectId(toks, pos + 1));
});
var parseJsxAtom = _curry4(3, (toks, pos, parseExpr) => eq3(jxTokAt(toks, pos).tok, TLt) ? _Result_map2((claim) => Some3(claim), parseJsx(toks, pos, parseExpr)) : Ok3(None3));
var seqElemExpr = (el) => match3(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var inferJsxArrElems = _curry4(3, (elements, st, inferExpr) => match3(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok3(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([el, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferJsxChildren = _curry4(3, (children, st, inferExpr) => match3(children).with((_v) => {
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
var rowField = _curry4(2, (row, label) => match3(row).with({ _tag: "RowExtend" }, ({ label: l, fieldType, rest }) => eq3(l, label) ? Some3(fieldType) : rowField(rest, label)).with({ _tag: "RowEmpty" }, () => None3).with({ _tag: "RowVar" }, () => None3).exhaustive());
var fieldNamed = _curry4(2, (label, fields) => match3(fields).with((_v) => _v.length === 0, () => false).with((_v) => _v.length >= 1, ([f, ...rest]) => or3(eq3(f.name, label), fieldNamed(label, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordHasAttr = _curry4(2, (expr, label) => match3(expr).with({ _tag: "ERecord" }, ({ fields }) => fieldNamed(label, fields)).otherwise(() => false));
var jsxChildCount = (restArgs) => match3(restArgs).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "EArr";
}, ([{ elements }]) => length3(elements)).otherwise(() => 0);
var jsxPropsWithSynthesizedChildren = _curry4(4, (propsT, propsExpr, expectedRow, restArgs) => match3(rowField(expectedRow, "children")).with({ _tag: "None" }, () => propsT).with({ _tag: "Some" }, ({ value: expectedChildren }) => match3(propsT).with({ _tag: "TyRecord" }, ({ row: prow }) => or3(recordHasAttr(propsExpr, "children"), eq3(jsxChildCount(restArgs), 0)) ? propsT : tRecord(rExtend("children", expectedChildren, prow))).otherwise(() => propsT)).exhaustive());
var attrKindType = (kind) => eq3(kind, "string") ? Some3(tPrim("string")) : eq3(kind, "number") ? Some3(tPrim("number")) : eq3(kind, "bool") ? Some3(tPrim("bool")) : eq3(kind, "string|number") ? Some3(tUnion([tPrim("string"), tPrim("number")])) : eq3(kind, "string|bool") ? Some3(tUnion([tPrim("string"), tPrim("bool")])) : _Str_startsWith("enum:", kind) ? Some3(tUnion(map2(tLit, _Str_split(",", _Str_slice2(5, _Str_length2(kind), kind))))) : None3;
var intrinsicAttrType = _curry4(2, (tag, attr) => _Option_flatMap(attrKindType, _Option_flatMap(_Map_get2(attr), _Map_get2(tag, intrinsicElements))));
var inferIntrinsicFields = _curry4(4, (tag, fields, st, api) => match3(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => match3(intrinsicAttrType(tag, f.name)).with({ _tag: "Some" }, ({ value: expectedT }) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => inferIntrinsicFields(tag, rest, st2, api), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st))).with({ _tag: "None" }, () => _Result_flatMap2(([_, st1]) => inferIntrinsicFields(tag, rest, st1, api), api.inferExpr(f.value, st))).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferJsxCall = _curry4(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap2(([tagT, st1]) => _Result_flatMap2(([propsT, st2]) => _Result_flatMap2((st3) => {
  const zonkedTag = zonk(tagT, st3);
  return match3(zonkedTag).with({ _tag: "TyFn" }, ({ from, to }) => match3(from).with({ _tag: "TyRecord" }, ({ row: expectedRow }) => ((propsForCheck) => _Result_map2((st4) => _tuple2(zonk(to, st4), st4), api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr))))(jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3)))).otherwise(() => match3(tagExpr).with({ _tag: "EStr" }, ({ value: tagName }) => match3(propsExpr).with({ _tag: "ERecord" }, ({ fields }) => _Result_map2((st4) => _tuple2(tPrim("VNode"), st4), inferIntrinsicFields(tagName, fields, st3, api))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3)))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3))));
}, inferJsxChildren(restArgs, st2, api.inferExpr)), api.inferExpr(propsExpr, st1)), api.inferExpr(tagExpr, st)));
var inferJsxCallHook = _curry4(5, (_fn, args, origin, st, api) => match3(origin).with({ _tag: "Some" }, ({ value: o }) => eq3(o, "jsx") ? match3(args).with((_v) => {
  const _g = _v;
  return _g.length >= 2;
}, ([tagExpr, propsExpr, ...rest]) => _Result_map2((r) => Some3(r), inferJsxCall(tagExpr, propsExpr, rest, st, api))).otherwise(() => Ok3(None3)) : Ok3(None3)).with({ _tag: "None" }, () => Ok3(None3)).exhaustive());
var jsxPlugin = { name: "jsx", parse: Some3(parseJsxAtom), inferCall: Some3(inferJsxCallHook) };

var DEFAULT_PLUGINS = [jsxPlugin];
var resolvePlugins = _curry5(2, (pluginsOpt, builtins) => match4(pluginsOpt).with({ _tag: "None" }, () => builtins).with({ _tag: "Some" }, ({ value: ps }) => eq4(length4(ps), 0) ? [] : _Array_concat(builtins, ps)).exhaustive());
var resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
var parseHooksFrom = _curry5(3, (plugins, i, acc) => match4(_Array_get3(i, plugins)).with({ _tag: "None" }, () => acc).with((_v) => _v._tag === "Some", ({ value: { parse } }) => match4(parse).with({ _tag: "Some" }, ({ value: hook }) => parseHooksFrom(plugins, i + 1, _Array_append4(hook, acc))).with({ _tag: "None" }, () => parseHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
var inferHooksFrom = _curry5(3, (plugins, i, acc) => match4(_Array_get3(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match4(p.inferCall).with({ _tag: "Some" }, ({ value: hook }) => inferHooksFrom(plugins, i + 1, _Array_append4(hook, acc))).with({ _tag: "None" }, () => inferHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var inferCallHooksOf = (plugins) => inferHooksFrom(plugins, 0, []);
var runParseHooks = _curry5(4, (hooks, toks, pos, parseExpr) => match4(hooks).with((_v) => _v.length === 0, () => Ok4(None4)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match4(hook(toks, pos, parseExpr)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match4(v).with({ _tag: "None" }, () => runParseHooks(rest, toks, pos, parseExpr)).with({ _tag: "Some" }, ({ value: claim }) => Ok4(Some4(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runInferCallHooks = _curry5(6, (hooks, fn, args, origin, st, api) => match4(hooks).with((_v) => _v.length === 0, () => Ok4(None4)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match4(hook(fn, args, origin, st, api)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match4(v).with({ _tag: "None" }, () => runInferCallHooks(rest, fn, args, origin, st, api)).with({ _tag: "Some" }, ({ value: claim }) => Ok4(Some4(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));

var tokName = (t) => match5(t).with({ _tag: "TLet" }, () => "let").with({ _tag: "TType" }, () => "type").with({ _tag: "TExtern" }, () => "extern").with({ _tag: "TSwitch" }, () => "switch").with({ _tag: "TLoop" }, () => "loop").with({ _tag: "TRecur" }, () => "recur").with({ _tag: "TDo" }, () => "do").with({ _tag: "TImport" }, () => "import").with({ _tag: "TExport" }, () => "export").with({ _tag: "TEq" }, () => "eq").with({ _tag: "TArrow" }, () => "arrow").with({ _tag: "TTarrow" }, () => "tarrow").with({ _tag: "TPipe" }, () => "pipe").with({ _tag: "TCompose" }, () => "compose").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TBar" }, () => "bar").with({ _tag: "TLparen" }, () => "lparen").with({ _tag: "TRparen" }, () => "rparen").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TLbracket" }, () => "lbracket").with({ _tag: "TRbracket" }, () => "rbracket").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TPlus" }, () => "plus").with({ _tag: "TMinus" }, () => "minus").with({ _tag: "TStar" }, () => "star").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TPercent" }, () => "percent").with({ _tag: "TAt" }, () => "at").with({ _tag: "THash" }, () => "hash").with({ _tag: "TTilde" }, () => "tilde").with({ _tag: "TDot" }, () => "dot").with({ _tag: "TColon" }, () => "colon").with({ _tag: "TQuestion" }, () => "question").with({ _tag: "TEqeq" }, () => "eqeq").with({ _tag: "TNeq" }, () => "neq").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGte" }, () => "gte").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TAndand" }, () => "andand").with({ _tag: "TOror" }, () => "oror").with({ _tag: "TBang" }, () => "bang").with({ _tag: "TBacktick" }, () => "backtick").with({ _tag: "TComma" }, () => "comma").with({ _tag: "TSemi" }, () => "semi").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TStr" }, () => "str").with({ _tag: "TTmplStart" }, () => "tmplstart").with({ _tag: "TTmplMid" }, () => "tmplmid").with({ _tag: "TTmplEnd" }, () => "tmplend").with({ _tag: "TId" }, () => "id").with({ _tag: "TEof" }, () => "eof").exhaustive();
var eofTok = { tok: TEof, start: 0, end: 0, doc: None5 };
var tokAt = _curry6(2, (toks, i) => _Option_unwrapOr3(eofTok, _Array_get4(i, toks)));
var spanOf = (lt4) => ({ start: lt4.start, end: lt4.end });
var spanning = _curry6(2, (a, b) => ({ start: a.start, end: b.end }));
var toEnd = _curry6(3, (start, toks, pos) => ({ start: start.start, end: tokAt(toks, pos - 1).end }));
var errAt = _curry6(2, (message, lt4) => Err5({ message, start: lt4.start, end: lt4.end }));
var expectTok = _curry6(3, (t, toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return eq5(lt4.tok, t) ? Ok5(pos + 1) : errAt(`expected ${tokName(t)}, got ${tokName(lt4.tok)}`, lt4);
});
var expectId = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match5(lt4.tok).with({ _tag: "TId" }, ({ value: name }) => Ok5(_tuple3({ name, span: spanOf(lt4) }, pos + 1))).otherwise((t) => errAt(`expected id, got ${tokName(t)}`, lt4));
});
var keywordText = (t) => match5(t).with({ _tag: "TLet" }, () => Some5("let")).with({ _tag: "TType" }, () => Some5("type")).with({ _tag: "TExtern" }, () => Some5("extern")).with({ _tag: "TSwitch" }, () => Some5("switch")).with({ _tag: "TLoop" }, () => Some5("loop")).with({ _tag: "TRecur" }, () => Some5("recur")).with({ _tag: "TDo" }, () => Some5("do")).with({ _tag: "TImport" }, () => Some5("import")).with({ _tag: "TExport" }, () => Some5("export")).otherwise(() => None5);
var expectLabel = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match5(keywordText(lt4.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok5(_tuple3({ name, span: spanOf(lt4) }, pos + 1))).with({ _tag: "None" }, () => expectId(toks, pos)).exhaustive();
});
var expectStr = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match5(lt4.tok).with({ _tag: "TStr" }, ({ value }) => Ok5(_tuple3(value, pos + 1))).otherwise((t) => errAt(`expected str, got ${tokName(t)}`, lt4));
});
var expectIn = _curry6(2, (toks, pos) => _Result_flatMap3(([kw, p]) => eq5(kw.name, "in") ? Ok5(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p)), expectId(toks, pos)));
var isUpper = (s) => _Option_exists3((n) => and4(n >= 65, n <= 90), _Str_codeAt3(0, s));
var sepBy = _curry6(4, (parseItem, toks, pos, acc) => _Result_flatMap3(([item, p]) => {
  const items = _Array_append5(item, acc);
  return eq5(tokAt(toks, p).tok, TComma) ? sepBy(parseItem, toks, p + 1, items) : Ok5(_tuple3(items, p));
}, parseItem(toks, pos)));
var sepByH = _curry6(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap3(([item, p]) => {
  const items = _Array_append5(item, acc);
  return eq5(tokAt(toks, p).tok, TComma) ? sepByH(parseItem, toks, p + 1, items, hooks) : Ok5(_tuple3(items, p));
}, parseItem(toks, pos, hooks)));
var listUntil = _curry6(4, (close, parseItem, toks, pos) => eq5(tokAt(toks, pos).tok, close) ? Ok5(_tuple3([], pos)) : sepBy(parseItem, toks, pos, []));
var listUntilH = _curry6(5, (close, parseItem, toks, pos, hooks) => eq5(tokAt(toks, pos).tok, close) ? Ok5(_tuple3([], pos)) : sepByH(parseItem, toks, pos, [], hooks));
var scanLambdaDepth = _curry6(3, (toks, k, depth) => match5(tokAt(toks, k).tok).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, k + 1, depth + 1)).with({ _tag: "TRparen" }, () => eq5(depth, 1) ? eq5(tokAt(toks, k + 1).tok, TArrow) : scanLambdaDepth(toks, k + 1, depth - 1)).with({ _tag: "TEof" }, () => false).otherwise(() => scanLambdaDepth(toks, k + 1, depth)));
var looksLikeLambda = _curry6(2, (toks, pos) => match5(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq5(tokAt(toks, pos + 1).tok, TArrow)).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, pos, 0)).otherwise(() => false));
var exprSpan = (e) => match5(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var tySpan = (t) => match5(t).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var parseParam = _curry6(2, (toks, pos) => match5(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => _Result_flatMap3(([fields, p]) => _Result_flatMap3((p2) => Ok5(_tuple3(LPSpanned(LPRecord(map3((f) => f.name, fields)), map3((f) => f.span, fields)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, expectId, toks, pos + 1))).with({ _tag: "TLparen" }, () => _Result_flatMap3(([names, p]) => _Result_flatMap3((p2) => Ok5(match5(names).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([single]) => _tuple3(LPSpanned(LPName(single.name, None5), [single.span]), p2)).otherwise((many) => _tuple3(LPSpanned(LPTuple(map3((n) => n.name, many)), map3((n) => n.span, many)), p2))), expectTok(TRparen, toks, p)), sepBy(expectId, toks, pos + 1, []))).otherwise(() => _Result_flatMap3(([nm, p]) => eq5(tokAt(toks, p).tok, TColon) ? _Result_map3(([annot, p2]) => _tuple3(LPSpanned(LPName(nm.name, Some5(annot)), [nm.span]), p2), parseTypeExpr(toks, p + 1)) : Ok5(_tuple3(LPSpanned(LPName(nm.name, None5), [nm.span]), p)), expectId(toks, pos))));
var parseLabeledParam = _curry6(3, (toks, pos, hooks) => _Result_flatMap3((p0) => _Result_flatMap3(([nm, p1]) => ((optional) => ((p2) => _Result_flatMap3(([annot, p3]) => eq5(tokAt(toks, p3).tok, TEq) ? _Result_map3(([d, k]) => _tuple3(LPSpanned(LPLabeled(nm.name, annot, optional, Some5(d)), [nm.span]), k), parseExpr(toks, p3 + 1, hooks)) : Ok5(_tuple3(LPSpanned(LPLabeled(nm.name, annot, optional, None5), [nm.span]), p3)), eq5(tokAt(toks, p2).tok, TColon) ? _Result_map3(([t, k]) => _tuple3(Some5(t), k), parseTypeExpr(toks, p2 + 1)) : Ok5(_tuple3(None5, p2))))(optional ? p1 + 1 : p1))(eq5(tokAt(toks, p1).tok, TQuestion)), expectLabel(toks, p0)), expectTok(TTilde, toks, pos)));
var parseLamParam = _curry6(3, (toks, pos, hooks) => eq5(tokAt(toks, pos).tok, TTilde) ? parseLabeledParam(toks, pos, hooks) : parseParam(toks, pos));
var isLabeledParam = (p) => match5(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam(inner)).otherwise(() => false);
var labeledTrailing = _curry6(2, (params, seen) => match5(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam(p) ? labeledTrailing(rest, true) : and4(not3(seen), labeledTrailing(rest, false))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var parseLambda = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return match5(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => _Result_flatMap3((p) => _Result_flatMap3(([body, p2]) => Ok5(_tuple3(ELambda([LPSpanned(LPName(name, None5), [spanOf(tokAt(toks, pos))])], body, spanning(start, exprSpan(body))), p2)), parseLambdaBody(toks, p, hooks)), expectTok(TArrow, toks, pos + 1))).otherwise(() => _Result_flatMap3((p) => _Result_flatMap3(([params, p2]) => _Result_flatMap3((p3) => labeledTrailing(params, false) ? _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => Ok5(_tuple3(ELambda(params, body, spanning(start, exprSpan(body))), p5)), parseLambdaBody(toks, p4, hooks)), expectTok(TArrow, toks, p3)) : errAt("labeled parameters must be a trailing group", tokAt(toks, p)), expectTok(TRparen, toks, p2)), listUntilH(TRparen, parseLamParam, toks, p, hooks)), expectTok(TLparen, toks, pos)));
});
var parseLambdaBody = _curry6(3, (toks, pos, hooks) => and4(eq5(tokAt(toks, pos).tok, TLbrace), arrowBodyIsDoBlock(toks, pos, 0)) ? parseDoBlock(toks, pos, hooks) : parseExpr(toks, pos, hooks));
var arrowBodyIsDoBlock = _curry6(3, (toks, pos, depth) => match5(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => arrowBodyIsDoBlock(toks, pos + 1, depth + 1)).with({ _tag: "TRbrace" }, () => eq5(depth, 1) ? false : arrowBodyIsDoBlock(toks, pos + 1, depth - 1)).with({ _tag: "TSemi" }, () => or4(eq5(depth, 1), arrowBodyIsDoBlock(toks, pos + 1, depth))).with({ _tag: "TEof" }, () => false).otherwise(() => arrowBodyIsDoBlock(toks, pos + 1, depth)));
var parseLetIn = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => or4(eq5(tokAt(toks, p).tok, TQuestion), eq5(tokAt(toks, p).tok, TBang)) ? ((monad) => ((paramSpan) => _Result_flatMap3(([param, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([value, p3]) => _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => Ok5(_tuple3(ELetBind(param, paramSpan, monad, value, body, spanning(start, exprSpan(body))), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p + 1)))(spanOf(tokAt(toks, p + 1))))(eq5(tokAt(toks, p).tok, TQuestion) ? "Result" : "Task") : eq5(tokAt(toks, p).tok, TLparen) ? ((paramStart) => _Result_flatMap3(([param, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([value, p3]) => _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => ((fn) => Ok5(_tuple3(ECall(fn, [value], None5, spanning(start, exprSpan(body))), p5)))(ELambda([param], body, spanning(paramStart, exprSpan(body)))), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p)))(spanOf(tokAt(toks, p))) : _Result_flatMap3(([nm, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([value, p3]) => _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => Ok5(_tuple3(ELetIn(nm.name, nm.span, value, body, spanning(start, exprSpan(body))), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), expectId(toks, p)), expectTok(TLet, toks, pos));
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
var mkBinCall = _curry6(4, (fnName, opSpan, left, right) => ECall(ERef(fnName, opSpan), [left, right], None5, spanning(exprSpan(left), exprSpan(right))));
var opFnName = (t) => match5(t).with({ _tag: "TPlus" }, () => "add").with({ _tag: "TMinus" }, () => "sub").with({ _tag: "TStar" }, () => "mul").with({ _tag: "TSlash" }, () => "div").with({ _tag: "TPercent" }, () => "mod").with({ _tag: "TAndand" }, () => "and").with({ _tag: "TOror" }, () => "or").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TEqeq" }, () => "eq").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var isSectionOp = (t) => match5(t).with({ _tag: "TPlus" }, () => true).with({ _tag: "TMinus" }, () => true).with({ _tag: "TStar" }, () => true).with({ _tag: "TSlash" }, () => true).with({ _tag: "TPercent" }, () => true).with({ _tag: "TAndand" }, () => true).with({ _tag: "TOror" }, () => true).with({ _tag: "TConcat" }, () => true).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var sectionBody = _curry6(4, (opTok, x, y, opSpan) => {
  const full = spanning(exprSpan(x), exprSpan(y));
  return eq5(opTok, TNeq) ? ECall(ERef("not", opSpan), [mkBinCall("eq", opSpan, x, y)], None5, full) : mkBinCall(opFnName(opTok), opSpan, x, y);
});
var sectionLeft = _curry6(2, (provided, opLt) => {
  const opSpan = spanOf(opLt);
  const paramRef = ERef("$s", opSpan);
  return ELambda([LPName("$s", None5)], sectionBody(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan));
});
var parseRightSection = _curry6(4, (toks, lparenSpan, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap3(([y, p1]) => _Result_flatMap3((p2) => ((paramRef) => Ok5(_tuple3(ELambda([LPName("$s", None5)], sectionBody(lt4.tok, paramRef, y, spanOf(lt4)), toEnd(lparenSpan, toks, p2)), p2)))(ERef("$s", spanOf(lt4))), expectTok(TRparen, toks, p1)), parseExpr(toks, pos + 1, hooks));
});
var binCallOrLeftSection = _curry6(7, (toks, left, lt4, pos, bp, fnName, hooks) => eq5(tokAt(toks, pos + 1).tok, TRparen) ? Ok5({ left: sectionLeft(left, lt4), p: pos + 1, matched: true }) : _Result_flatMap3(([right, p]) => Ok5({ left: mkBinCall(fnName, spanOf(lt4), left, right), p, matched: true }), parseExprBp(toks, bp + 1, pos + 1, hooks)));
var isCmpTok = (t) => match5(t).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var cmpFnName = (t) => match5(t).with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var parseInfix = _curry6(5, (toks, minBp, left, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return and4(eq5(lt4.tok, TPipe), PIPE_BP >= minBp) ? _Result_flatMap3(([right, p]) => Ok5({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall(toks, pos + 1, hooks)) : and4(eq5(lt4.tok, TTarrow), FAST_PIPE_BP >= minBp) ? _Result_flatMap3(([right, p]) => match5(right).with({ _tag: "ECall" }, ({ span: rightSpan }) => Ok5({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true })).otherwise(() => errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt4)), parseAtomOrCall(toks, pos + 1, hooks)) : and4(eq5(lt4.tok, TCompose), COMPOSE_BP >= minBp) ? _Result_flatMap3(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok5({ left: fn, p, matched: true }))(ELambda([LPName("$x", None5)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None5, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None5, exprSpan(left))))(ERef("$x", opSpan)))(spanOf(lt4)), parseExprBp(toks, COMPOSE_BP + 1, pos + 1, hooks)) : and4(isCmpTok(lt4.tok), CMP_BP >= minBp) ? eq5(tokAt(toks, pos + 1).tok, TRparen) ? Ok5({ left: sectionLeft(left, lt4), p: pos + 1, matched: true }) : _Result_flatMap3(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok5({ left: result, p, matched: true }))(eq5(lt4.tok, TNeq) ? ECall(ERef("not", opSpan), [inner], None5, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall(cmpFnName(lt4.tok), opSpan, left, right)))(spanOf(lt4)), parseExprBp(toks, CMP_BP + 1, pos + 1, hooks)) : and4(or4(eq5(lt4.tok, TAndand), eq5(lt4.tok, TOror)), (eq5(lt4.tok, TAndand) ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, bp, fnName, hooks))(eq5(lt4.tok, TAndand) ? "and" : "or"))(eq5(lt4.tok, TAndand) ? AND_BP : OR_BP) : and4(eq5(lt4.tok, TConcat), CONCAT_BP >= minBp) ? binCallOrLeftSection(toks, left, lt4, pos, CONCAT_BP, "concat", hooks) : and4(eq5(lt4.tok, TBacktick), BACKTICK_BP >= minBp) ? _Result_flatMap3(([fnExpr, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([right, p3]) => Ok5({ left: ECall(fnExpr, [left, right], None5, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp(toks, BACKTICK_BP + 1, p2, hooks)), expectTok(TBacktick, toks, p1)), parseAtomOrCall(toks, pos + 1, hooks)) : and4(or4(eq5(lt4.tok, TPlus), eq5(lt4.tok, TMinus)), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, ADD_BP, fnName, hooks))(eq5(lt4.tok, TPlus) ? "add" : "sub") : and4(or4(eq5(lt4.tok, TStar), or4(eq5(lt4.tok, TSlash), eq5(lt4.tok, TPercent))), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, MUL_BP, fnName, hooks))(eq5(lt4.tok, TStar) ? "mul" : eq5(lt4.tok, TSlash) ? "div" : "mod") : Ok5({ left, p: pos, matched: false });
});
var infixLoop = _curry6(5, (toks, minBp, left, pos, hooks) => _Result_flatMap3((res) => res.matched ? infixLoop(toks, minBp, res.left, res.p, hooks) : Ok5(_tuple3(res.left, res.p)), parseInfix(toks, minBp, left, pos, hooks)));
var ternaryTail = _curry6(4, (toks, cond, pos, hooks) => eq5(tokAt(toks, pos).tok, TQuestion) ? _Result_flatMap3(([thenE, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([elseE, p3]) => Ok5(_tuple3(ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p1)), parseExpr(toks, pos + 1, hooks)) : Ok5(_tuple3(cond, pos)));
var parseExprBp = _curry6(4, (toks, minBp, pos, hooks) => match5(tokAt(toks, pos).tok).with({ _tag: "TLet" }, () => parseLetIn(toks, pos, hooks)).otherwise(() => and4(eq5(minBp, 0), looksLikeLambda(toks, pos)) ? parseLambda(toks, pos, hooks) : _Result_flatMap3(([left, p]) => _Result_flatMap3(([left2, p2]) => eq5(minBp, 0) ? ternaryTail(toks, left2, p2, hooks) : Ok5(_tuple3(left2, p2)), infixLoop(toks, minBp, left, p, hooks)), parseAtomOrCall(toks, pos, hooks))));
var parseExpr = _curry6(3, (toks, pos, hooks) => parseExprBp(toks, 0, pos, hooks));
var CPPos = (value) => ({ _tag: "CPPos", value });
var CPLab = _curry6(3, (name, value, labelSpan) => ({ _tag: "CPLab", name, value, labelSpan }));
var parseCallPart = _curry6(3, (toks, pos, hooks) => eq5(tokAt(toks, pos).tok, TTilde) ? _Result_flatMap3(([nm, p]) => eq5(tokAt(toks, p).tok, TEq) ? _Result_map3(([v, k]) => _tuple3(CPLab(nm.name, v, nm.span), k), parseExpr(toks, p + 1, hooks)) : Ok5(_tuple3(CPLab(nm.name, ERef(nm.name, nm.span), nm.span), p)), expectLabel(toks, pos + 1)) : _Result_map3(([v, k]) => _tuple3(CPPos(v), k), parseExpr(toks, pos, hooks)));
var callPartSpan = (p) => match5(p).with({ _tag: "CPPos" }, ({ value }) => exprSpan(value)).with({ _tag: "CPLab" }, ({ value, labelSpan }) => spanning(labelSpan, exprSpan(value))).exhaustive();
var splitCallParts = _curry6(3, (parts, positional, labeled) => match5(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok5(_tuple3(positional, labeled))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => match5(p).with({ _tag: "CPLab" }, () => splitCallParts(rest, positional, _Array_append5(p, labeled))).with({ _tag: "CPPos" }, ({ value }) => match5(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => splitCallParts(rest, _Array_append5(value, positional), labeled)).otherwise(() => errAt("labeled arguments must be a trailing group", callPartSpan(p)))).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labeledField = (p) => match5(p).with({ _tag: "CPLab" }, ({ name, value }) => ({ name, value })).with({ _tag: "CPPos" }, ({ value }) => ({ name: "", value })).exhaustive();
var unionSpans = _curry6(2, (parts, acc) => match5(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => unionSpans(rest, spanning(acc, callPartSpan(p)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var callArgsOf = (parts) => _Result_map3(([positional, labeled]) => match5(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple3(positional, None5)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _tuple3(_Array_append5(ERecord(map3(labeledField, labeled), None5, unionSpans(rest, callPartSpan(first))), positional), Some5("labeled"))).otherwise(() => {
  throw new Error("non-exhaustive match");
}), splitCallParts(parts, [], []));
var postfixLoop = _curry6(4, (toks, e, pos, hooks) => match5(tokAt(toks, pos).tok).with({ _tag: "TLparen" }, () => _Result_flatMap3(([parts, p]) => _Result_flatMap3((p2) => _Result_flatMap3(([args, origin]) => postfixLoop(toks, ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)), p2, hooks), callArgsOf(parts)), expectTok(TRparen, toks, p)), listUntilH(TRparen, parseCallPart, toks, pos + 1, hooks))).with({ _tag: "TDot" }, () => _Result_flatMap3(([id, p]) => postfixLoop(toks, EField(e, id.name, false, spanning(exprSpan(e), id.span)), p, hooks), expectLabel(toks, pos + 1))).otherwise(() => Ok5(_tuple3(e, pos))));
var parseAtomOrCall = _curry6(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return or4(eq5(lt4.tok, TMinus), eq5(lt4.tok, TBang)) ? _Result_flatMap3(([operand, p]) => ((fnName) => Ok5(_tuple3(ECall(ERef(fnName, spanOf(lt4)), [operand], None5, spanning(spanOf(lt4), exprSpan(operand))), p)))(eq5(lt4.tok, TMinus) ? "negate" : "not"), parseAtomOrCall(toks, pos + 1, hooks)) : _Result_flatMap3(([e, p]) => postfixLoop(toks, e, p, hooks), parseAtom(toks, pos, hooks));
});
var parseAtom = _curry6(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match5(lt4.tok).with({ _tag: "TSwitch" }, () => parseMatch(toks, pos, hooks)).with({ _tag: "TDo" }, () => parseDo(toks, pos, hooks)).with({ _tag: "TLoop" }, () => parseLoop(toks, pos, hooks)).with({ _tag: "TRecur" }, () => parseRecur(toks, pos, hooks)).with({ _tag: "TLbrace" }, () => parseRecord(toks, pos, hooks)).with({ _tag: "TLbracket" }, () => parseArr(toks, pos, hooks)).with({ _tag: "TAt" }, () => parseList(toks, pos, hooks)).with({ _tag: "THash" }, () => parseHash(toks, pos, hooks)).with({ _tag: "TTmplStart" }, () => parseInterp(toks, pos, hooks)).otherwise(() => _Result_flatMap3((claimed) => match5(claimed).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [e, p] }) => Ok5(_tuple3(e, p))).with({ _tag: "None" }, () => match5(lt4.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok5(_tuple3(ENum(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok5(_tuple3(EBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok5(_tuple3(EStr(value, sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => Ok5(_tuple3(ERef(name, sp), pos + 1))).with({ _tag: "TLparen" }, () => ((nxt) => eq5(nxt.tok, TRparen) ? Ok5(_tuple3(EUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : and4(isSectionOp(nxt.tok), not3(eq5(nxt.tok, TMinus))) ? parseRightSection(toks, sp, pos + 1, hooks) : _Result_flatMap3(([first, p]) => eq5(tokAt(toks, p).tok, TComma) ? _Result_flatMap3(([elements, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(ETuple(elements, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p + 1, [first], hooks)) : _Result_map3((p2) => _tuple3(first, p2), expectTok(TRparen, toks, p)), parseExpr(toks, pos + 1, hooks)))(tokAt(toks, pos + 1))).otherwise((t) => errAt(`unexpected token ${tokName(t)}`, lt4))).exhaustive(), runParseHooks(hooks, toks, pos, _curry6(2, (t, p) => parseExpr(t, p, hooks)))));
});
var parseInterpLoop = _curry6(5, (toks, pos, start, acc, hooks) => _Result_flatMap3(([holeExpr, p]) => ((acc2) => ((lt4) => match5(lt4.tok).with({ _tag: "TTmplMid" }, ({ value }) => parseInterpLoop(toks, p + 1, start, _Array_append5(IPLit(value), acc2), hooks)).with({ _tag: "TTmplEnd" }, ({ value }) => Ok5(_tuple3(EInterp(_Array_append5(IPLit(value), acc2), toEnd(start, toks, p + 1)), p + 1))).otherwise((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt4)))(tokAt(toks, p)))(_Array_append5(IPExpr(holeExpr), acc)), parseExpr(toks, pos, hooks)));
var parseInterp = _curry6(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return match5(lt4.tok).with({ _tag: "TTmplStart" }, ({ value }) => parseInterpLoop(toks, pos + 1, spanOf(lt4), [IPLit(value)], hooks)).otherwise((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt4));
});
var parseField = _curry6(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap3(([nm, p]) => eq5(tokAt(toks, p).tok, TColon) ? _Result_flatMap3(([value, p2]) => Ok5(_tuple3({ name: nm.name, value }, p2)), parseExpr(toks, p + 1, hooks)) : not3(eq5(keywordText(lt4.tok), None5)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <expr>'`, lt4) : Ok5(_tuple3({ name: nm.name, value: ERef(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseRecord = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => eq5(tokAt(toks, p).tok, TSpread) ? _Result_flatMap3(([spreadExpr, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([fields, p3]) => _Result_flatMap3((p4) => Ok5(_tuple3(ERecord(fields, Some5(spreadExpr), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), listUntilH(TRbrace, parseField, toks, p2, hooks)), eq5(tokAt(toks, p1).tok, TRbrace) ? Ok5(p1) : expectTok(TComma, toks, p1)), parseExpr(toks, p + 1, hooks)) : _Result_flatMap3(([fields, p1]) => _Result_flatMap3((p2) => Ok5(_tuple3(ERecord(fields, None5, toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)), listUntilH(TRbrace, parseField, toks, p, hooks)), expectTok(TLbrace, toks, pos));
});
var parseSeqElem = _curry6(3, (toks, pos, hooks) => eq5(tokAt(toks, pos).tok, TSpread) ? _Result_flatMap3(([ex, p]) => Ok5(_tuple3(SESpread(ex), p)), parseExpr(toks, pos + 1, hooks)) : _Result_flatMap3(([ex, p]) => Ok5(_tuple3(SEExpr(ex), p)), parseExpr(toks, pos, hooks)));
var parseArr = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3(([elements, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(EArr(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbracket, toks, p2)), listUntilH(TRbracket, parseSeqElem, toks, p, hooks)), expectTok(TLbracket, toks, pos));
});
var parseList = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3((p1) => _Result_flatMap3(([elements, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(EList(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parseMapEntry = _curry6(3, (toks, pos, hooks) => _Result_flatMap3(([key, p]) => _Result_flatMap3((p2) => _Result_flatMap3(([value, p3]) => Ok5(_tuple3({ key, value }, p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p)), parseExpr(toks, pos, hooks)));
var parseHash = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3((p1) => eq5(tokAt(toks, p1).tok, TRbrace) ? _Result_flatMap3((p2) => Ok5(_tuple3(EMap([], toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)) : eq5(tokAt(toks, p1).tok, TSpread) ? _Result_flatMap3(([elements, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(ESet(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap3(([first, p2]) => eq5(tokAt(toks, p2).tok, TColon) ? _Result_flatMap3((p3) => _Result_flatMap3(([value, p4]) => _Result_flatMap3(([rest, p5]) => _Result_flatMap3((p6) => Ok5(_tuple3(EMap(_Array_prepend2({ key: first, value }, rest), toEnd(start, toks, p6)), p6)), expectTok(TRbrace, toks, p5)), eq5(tokAt(toks, p4).tok, TComma) ? listUntilH(TRbrace, parseMapEntry, toks, p4 + 1, hooks) : Ok5(_tuple3([], p4))), parseExpr(toks, p3, hooks)), expectTok(TColon, toks, p2)) : _Result_flatMap3(([rest, p3]) => _Result_flatMap3((p4) => Ok5(_tuple3(ESet(_Array_prepend2(SEExpr(first), rest), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), eq5(tokAt(toks, p2).tok, TComma) ? listUntilH(TRbrace, parseSeqElem, toks, p2 + 1, hooks) : Ok5(_tuple3([], p2))), parseExpr(toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(THash, toks, pos));
});
var parseGuard = _curry6(3, (toks, pos, hooks) => match5(tokAt(toks, pos).tok).with({ _tag: "TId", value: "when" }, () => _Result_map3(([g, p]) => _tuple3(Some5(g), p), parseExpr(toks, pos + 1, hooks))).otherwise(() => Ok5(_tuple3(None5, pos))));
var patSpan = (p) => match5(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var altsLoop = _curry6(4, (toks, pos, acc, lastSpan) => eq5(tokAt(toks, pos).tok, TBar) ? _Result_flatMap3(([alt, p1]) => altsLoop(toks, p1, _Array_append5(alt, acc), patSpan(alt)), parsePattern(toks, pos + 1)) : Ok5(_tuple3(acc, pos, lastSpan)));
var armsLoop = _curry6(4, (toks, pos, acc, hooks) => eq5(tokAt(toks, pos).tok, TBar) ? _Result_flatMap3(([first, p1]) => _Result_flatMap3(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap3(([guard, p3]) => _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => armsLoop(toks, p5, _Array_append5({ pattern, guard, body }, acc), hooks), parseExpr(toks, p4, hooks)), expectTok(TArrow, toks, p3)), parseGuard(toks, p2, hooks)))(eq5(length5(alts), 1) ? first : POr(alts, spanning(patSpan(first), lastSpan))), altsLoop(toks, p1, [first], patSpan(first))), parsePattern(toks, pos + 1)) : Ok5(_tuple3(acc, pos)));
var parseDo = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => parseDoBlockFrom(toks, start, p, hooks), expectTok(TDo, toks, pos));
});
var parseDoBlock = _curry6(3, (toks, pos, hooks) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks));
var parseDoBlockFrom = _curry6(4, (toks, start, pos, hooks) => _Result_flatMap3((p1) => eq5(tokAt(toks, p1).tok, TRbrace) ? errAt("do block needs a final expression", tokAt(toks, p1)) : _Result_flatMap3(([exprs, p2]) => eq5(tokAt(toks, p2).tok, TSemi) ? errAt("do block cannot end with a semicolon", tokAt(toks, p2)) : _Result_flatMap3((p3) => Ok5(_tuple3(EDo(exprs, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), parseDoExprs(toks, p1, [], hooks)), expectTok(TLbrace, toks, pos)));
var parseDoExprs = _curry6(4, (toks, pos, acc, hooks) => _Result_flatMap3(([expr, p]) => ((next) => eq5(tokAt(toks, p).tok, TSemi) ? parseDoExprs(toks, p + 1, next, hooks) : Ok5(_tuple3(next, p)))(_Array_append5(expr, acc)), parseExpr(toks, pos, hooks)));
var parseLoop = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3((p1) => _Result_flatMap3(([params, p2]) => _Result_flatMap3((p3) => _Result_flatMap3((p4) => _Result_flatMap3(([body, p5]) => _Result_map3((p6) => _tuple3(ELoop(params, body, toEnd(start, toks, p6)), p6), expectTok(TRbrace, toks, p5)), parseExpr(toks, p4, hooks)), expectTok(TLbrace, toks, p3)), expectTok(TRparen, toks, p2)), loopParamsLoop(toks, p1, [], hooks)), expectTok(TLparen, toks, p)), expectTok(TLoop, toks, pos));
});
var loopParamsLoop = _curry6(4, (toks, pos, acc, hooks) => _Result_flatMap3(([id, pid]) => _Result_flatMap3((p) => _Result_flatMap3(([init, p1]) => ((next) => match5(tokAt(toks, p1).tok).with({ _tag: "TComma" }, () => loopParamsLoop(toks, p1 + 1, next, hooks)).otherwise(() => Ok5(_tuple3(next, p1))))(_Array_append5({ name: id.name, nameSpan: id.span, init }, acc)), parseExpr(toks, p, hooks)), expectTok(TEq, toks, pid)), expectId(toks, pos)));
var parseRecur = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3((p1) => match5(tokAt(toks, p1).tok).with({ _tag: "TRparen" }, () => Ok5(_tuple3(ERecur([], toEnd(start, toks, p1 + 1)), p1 + 1))).otherwise(() => _Result_flatMap3(([args, p2]) => _Result_map3((p3) => _tuple3(ERecur(args, toEnd(start, toks, p3)), p3), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p1, [], hooks))), expectTok(TLparen, toks, p)), expectTok(TRecur, toks, pos));
});
var parseMatch = _curry6(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3(([scrutinee, p1]) => _Result_flatMap3((p2) => _Result_flatMap3(([arms, p3]) => match5(length5(arms)).with(0, () => errAt("switch needs at least one | arm", tokAt(toks, p3))).otherwise(() => _Result_map3((p4) => _tuple3(EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4), expectTok(TRbrace, toks, p3))), armsLoop(toks, p2, [], hooks)), expectTok(TLbrace, toks, p1)), parseExpr(toks, p, hooks)), expectTok(TSwitch, toks, pos));
});
var parseCtorArgs = _curry6(5, (toks, ctor, ns, nameSpan, pos) => eq5(tokAt(toks, pos).tok, TLparen) ? _Result_flatMap3(([args, p]) => _Result_flatMap3((p2) => Ok5(_tuple3(PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)), expectTok(TRparen, toks, p)), listUntil(TRparen, parsePattern, toks, pos + 1)) : Ok5(_tuple3(PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos)));
var parsePatternAtom = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match5(lt4.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok5(_tuple3(PLit2(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok5(_tuple3(PBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok5(_tuple3(PStr(value, sp), pos + 1))).with({ _tag: "TLparen" }, () => eq5(tokAt(toks, pos + 1).tok, TRparen) ? Ok5(_tuple3(PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap3(([elems, p]) => _Result_flatMap3((p2) => Ok5(match5(elems).with((_v) => {
    const _g = _v;
    return _g.length === 1;
  }, ([single]) => _tuple3(single, p2)).otherwise((many) => _tuple3(PTuple(many, toEnd(sp, toks, p2)), p2))), expectTok(TRparen, toks, p)), sepBy(parsePattern, toks, pos + 1, []))).with({ _tag: "TLbrace" }, () => _Result_flatMap3(([fields, p]) => _Result_flatMap3((p2) => Ok5(_tuple3(PRecord(fields, toEnd(sp, toks, p2)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, parsePatField, toks, pos + 1))).with({ _tag: "TLbracket" }, () => parseArrPattern(toks, pos)).with({ _tag: "TAt" }, () => parseListPattern(toks, pos)).with({ _tag: "TId", value: "_" }, () => Ok5(_tuple3(PWild(sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => eq5(tokAt(toks, pos + 1).tok, TDot) ? _Result_flatMap3(([c, p1]) => isUpper(c.name) ? parseCtorArgs(toks, c.name, Some5(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt(toks, p1)), expectId(toks, pos + 2)) : isUpper(name) ? parseCtorArgs(toks, name, None5, sp, pos + 1) : Ok5(_tuple3(PBind(name, sp), pos + 1))).otherwise((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt4));
});
var parsePattern = _curry6(2, (toks, pos) => _Result_flatMap3(([pat, p]) => match5(tokAt(toks, p).tok).with({ _tag: "TId", value: "as" }, () => _Result_flatMap3(([nm, p2]) => Ok5(_tuple3(PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2)), expectId(toks, p + 1))).otherwise(() => Ok5(_tuple3(pat, p))), parsePatternAtom(toks, pos)));
var restOk = (rest) => match5(rest).with({ _tag: "None" }, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PWild";
}, () => true).with({ _tag: "Some" }, () => false).exhaustive();
var patElemsLoop = _curry6(3, (toks, pos, acc) => match5(tokAt(toks, pos).tok).with({ _tag: "TSpread" }, () => _Result_flatMap3(([rest, p]) => Ok5(_tuple3(acc, Some5(rest), p)), parsePattern(toks, pos + 1))).otherwise(() => _Result_flatMap3(([pat, p]) => ((elems) => eq5(tokAt(toks, p).tok, TComma) ? patElemsLoop(toks, p + 1, elems) : Ok5(_tuple3(elems, None5, p)))(_Array_append5(pat, acc)), parsePattern(toks, pos))));
var parseArrPattern = _curry6(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => eq5(tokAt(toks, p).tok, TRbracket) ? Ok5(_tuple3(PArr([], None5, toEnd(start, toks, p + 1)), p + 1)) : _Result_flatMap3(([elems, rest, p2]) => restOk(rest) ? _Result_map3((p3) => _tuple3(PArr(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p, [])), expectTok(TLbracket, toks, pos));
});
var parseListPattern = _curry6(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3((p1) => eq5(tokAt(toks, p1).tok, TRbrace) ? Ok5(_tuple3(PList([], None5, toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap3(([elems, rest, p2]) => restOk(rest) ? _Result_map3((p3) => _tuple3(PList(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p1, [])), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parsePatField = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap3(([nm, p]) => eq5(tokAt(toks, p).tok, TColon) ? _Result_flatMap3(([pat, p2]) => Ok5(_tuple3({ label: nm.name, pat }, p2)), parsePattern(toks, p + 1)) : not3(eq5(keywordText(lt4.tok), None5)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <pattern>'`, lt4) : Ok5(_tuple3({ label: nm.name, pat: PBind(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseTypeAtom = _curry6(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match5(lt4.tok).with({ _tag: "TLparen" }, () => eq5(tokAt(toks, pos + 1).tok, TRparen) ? Ok5(_tuple3(TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap3(([inner, p]) => eq5(tokAt(toks, p).tok, TComma) ? _Result_flatMap3(([elems, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(TyTuple(elems, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepBy(parseTypeExpr, toks, p + 1, [inner])) : _Result_map3((p2) => _tuple3(inner, p2), expectTok(TRparen, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TLbracket" }, () => _Result_flatMap3(([elem, p]) => _Result_flatMap3((p2) => Ok5(_tuple3(TyList(elem, toEnd(sp, toks, p2)), p2)), expectTok(TRbracket, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok5(_tuple3(TyLit(value, sp), pos + 1))).otherwise(() => _Result_flatMap3(([nm, p]) => and4(isUpper(nm.name), eq5(tokAt(toks, p).tok, TDot)) ? _Result_flatMap3(([q, p2]) => isUpper(q.name) ? Ok5(_tuple3(TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2)) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt(toks, p2)), expectId(toks, p + 1)) : Ok5(_tuple3(TyName(nm.name, nm.span), p)), expectId(toks, pos)));
});
var startsTypeAtom = (t) => match5(t).with({ _tag: "TId" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).with({ _tag: "TStr" }, () => true).otherwise(() => false);
var legacyTypeArgsLoop = _curry6(4, (toks, pos, acc, lastSp) => startsTypeAtom(tokAt(toks, pos).tok) ? _Result_flatMap3(([a, p]) => legacyTypeArgsLoop(toks, p, _Array_append5(a, acc), Some5(tySpan(a))), parseTypeAtom(toks, pos)) : Ok5(_tuple3(acc, lastSp, pos)));
var parseTypeApp = _curry6(2, (toks, pos) => _Result_flatMap3(([head, p]) => match5(head).with((_v) => {
  const _g = _v;
  return _g._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_g);
}, ({ name, span: sp }) => eq5(tokAt(toks, p).tok, TLt) ? _Result_flatMap3(([args, p1]) => _Result_flatMap3((p2) => Ok5(_tuple3(TyApp(name, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap3(([args, lastSp, p2]) => Ok5(match5(lastSp).with({ _tag: "None" }, () => _tuple3(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple3(TyApp(name, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None5))).with({ _tag: "TyQual" }, ({ alias, name: nm, nameSpan, span: sp }) => eq5(tokAt(toks, p).tok, TLt) ? _Result_flatMap3(([args, p1]) => _Result_flatMap3((p2) => Ok5(_tuple3(TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap3(([args, lastSp, p2]) => Ok5(match5(lastSp).with({ _tag: "None" }, () => _tuple3(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple3(TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None5))).otherwise(() => Ok5(_tuple3(head, p))), parseTypeAtom(toks, pos)));
var parseTypeUnionRest = _curry6(4, (toks, pos, acc, lastSp) => eq5(tokAt(toks, pos).tok, TBar) ? _Result_flatMap3(([m, p]) => parseTypeUnionRest(toks, p, _Array_append5(m, acc), tySpan(m)), parseTypeApp(toks, pos + 1)) : Ok5(_tuple3(acc, lastSp, pos)));
var parseTypeUnion = _curry6(2, (toks, pos) => _Result_flatMap3(([first, p]) => eq5(tokAt(toks, p).tok, TBar) ? _Result_flatMap3(([members, lastSp, p2]) => Ok5(_tuple3(TyUnion(members, spanning(tySpan(first), lastSp)), p2)), parseTypeUnionRest(toks, p, [first], tySpan(first))) : Ok5(_tuple3(first, p)), parseTypeApp(toks, pos)));
var parseTypeExpr = _curry6(2, (toks, pos) => _Result_flatMap3(([from, p]) => eq5(tokAt(toks, p).tok, TTarrow) ? _Result_flatMap3(([to, p2]) => Ok5(_tuple3(TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)), parseTypeExpr(toks, p + 1)) : Ok5(_tuple3(from, p)), parseTypeUnion(toks, pos)));
var parseCtorField = _curry6(2, (toks, pos) => {
  const isLabel = match5(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq5(tokAt(toks, pos + 1).tok, TColon)).otherwise(() => false);
  return isLabel ? _Result_flatMap3(([nm, p]) => _Result_flatMap3(([t, p2]) => Ok5(_tuple3({ name: Some5(nm.name), fieldType: t }, p2)), parseTypeExpr(toks, p + 1)), expectId(toks, pos)) : _Result_map3(([t, p]) => _tuple3({ name: None5, fieldType: t }, p), parseTypeExpr(toks, pos));
});
var parseCtor = _curry6(2, (toks, pos) => _Result_flatMap3(([nm, p]) => eq5(tokAt(toks, p).tok, TLparen) ? _Result_flatMap3(([fields, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3({ name: nm.name, fields }, p3)), expectTok(TRparen, toks, p2)), listUntil(TRparen, parseCtorField, toks, p + 1)) : Ok5(_tuple3({ name: nm.name, fields: [] }, p)), expectId(toks, pos)));
var ctorsLoop = _curry6(3, (toks, pos, acc) => _Result_flatMap3(([c, p]) => ((cs) => eq5(tokAt(toks, p).tok, TBar) ? ctorsLoop(toks, p + 1, cs) : Ok5(_tuple3(cs, p)))(_Array_append5(c, acc)), parseCtor(toks, pos)));
var parseAliasField = _curry6(2, (toks, pos) => _Result_flatMap3(([nm, p]) => ((optional) => ((p1) => _Result_flatMap3((p2) => _Result_flatMap3(([t, p3]) => Ok5(_tuple3({ name: nm.name, fieldType: t, optional }, p3)), parseTypeExpr(toks, p2)), expectTok(TColon, toks, p1)))(optional ? p + 1 : p))(eq5(tokAt(toks, p).tok, TQuestion)), expectLabel(toks, pos)));
var parseAliasBody = _curry6(2, (toks, pos) => _Result_flatMap3((p) => _Result_flatMap3(([fields, p2]) => _Result_flatMap3((p3) => Ok5(_tuple3(fields, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, parseAliasField, toks, p)), expectTok(TLbrace, toks, pos)));
var typeParamsLoop = _curry6(3, (toks, pos, acc) => match5(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => typeParamsLoop(toks, pos + 1, _Array_append5(name, acc))).otherwise(() => Ok5(_tuple3(acc, pos))));
var parseTypeParams = _curry6(2, (toks, pos) => eq5(tokAt(toks, pos).tok, TLt) ? _Result_flatMap3(([names, p]) => _Result_map3((p2) => _tuple3(map3((n) => n.name, names), p2), expectTok(TGt, toks, p)), listUntil(TGt, expectId, toks, pos + 1)) : typeParamsLoop(toks, pos, []));
var startsTypeSynonym = (t) => match5(t).with({ _tag: "TStr" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).otherwise(() => false);
var parseType = _curry6(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3(([nm, p1]) => _Result_flatMap3(([params, p2]) => _Result_flatMap3((p3) => eq5(tokAt(toks, p3).tok, TLbrace) ? _Result_map3(([alias, p4]) => _tuple3(SType(nm.name, params, [], Some5(alias), None5, false, None5, toEnd(start, toks, p4)), p4), parseAliasBody(toks, p3)) : startsTypeSynonym(tokAt(toks, p3).tok) ? _Result_flatMap3(([te, p4]) => Ok5(_tuple3(SType(nm.name, params, [], None5, Some5(te), false, None5, toEnd(start, toks, p4)), p4)), parseTypeExpr(toks, p3)) : ((afterBar) => _Result_map3(([ctors, p4]) => _tuple3(SType(nm.name, params, ctors, None5, None5, false, None5, toEnd(start, toks, p4)), p4), ctorsLoop(toks, afterBar, [])))(eq5(tokAt(toks, p3).tok, TBar) ? p3 + 1 : p3), expectTok(TEq, toks, p2)), parseTypeParams(toks, p1)), expectId(toks, p)), expectTok(TType, toks, pos));
});
var parseExtern = _curry6(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => eq5(tokAt(toks, p).tok, TType) ? _Result_flatMap3((p1) => _Result_flatMap3(([nm, p2]) => Ok5(_tuple3(SType(nm.name, [], [], None5, None5, false, None5, toEnd(start, toks, p2)), p2)), expectId(toks, p1)), expectTok(TType, toks, p)) : _Result_flatMap3(([nm, p1]) => _Result_flatMap3(([params, p2]) => _Result_flatMap3((p3) => _Result_flatMap3(([t, p4]) => _Result_flatMap3((p5) => ((isCurried) => ((pConv) => ((nextTok) => or4(or4(or4(or4(eq5(nextTok, TId("global")), eq5(nextTok, TId("send"))), eq5(nextTok, TId("get"))), eq5(nextTok, TId("set"))), eq5(nextTok, TId("new"))) ? isCurried ? errAt("'curried' applies to a module extern, not a JS convention \u2014 give the host's module and export instead", tokAt(toks, pConv)) : _Result_flatMap3(([convention, p6]) => _Result_flatMap3(([first, p7]) => ((hasSecond) => _Result_flatMap3(([second, p8]) => Ok5(_tuple3(SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None5, toEnd(start, toks, p8)), p8)), hasSecond ? expectStr(toks, p7) : Ok5(_tuple3("", p7))))(match5(tokAt(toks, p7).tok).with({ _tag: "TStr" }, () => or4(eq5(convention.name, "global"), eq5(convention.name, "new"))).otherwise(() => false)), expectStr(toks, p6)), expectId(toks, pConv)) : _Result_flatMap3(([moduleName, p6]) => _Result_flatMap3(([importedName, p7]) => Ok5(_tuple3(SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None5, toEnd(start, toks, p7)), p7)), expectStr(toks, p6)), expectStr(toks, pConv)))(tokAt(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(eq5(tokAt(toks, p5).tok, TId("curried"))), expectTok(TEq, toks, p4)), parseTypeExpr(toks, p3)), expectTok(TColon, toks, p2)), eq5(tokAt(toks, p1).tok, TLt) ? _Result_flatMap3(([names, pParams]) => _Result_flatMap3((pAfter) => Ok5(_tuple3(map3((n) => n.name, names), pAfter)), expectTok(TGt, toks, pParams)), listUntil(TGt, expectId, toks, p1 + 1)) : Ok5(_tuple3([], p1))), expectId(toks, p)), expectTok(TExtern, toks, pos));
});
var parseImportNs = _curry6(3, (toks, start, pos) => _Result_flatMap3(([asKw, p1]) => eq5(asKw.name, "as") ? _Result_flatMap3(([alias, p2]) => _Result_flatMap3(([kw, p3]) => eq5(kw.name, "from") ? _Result_map3(([path, p4]) => _tuple3(SImportNs(alias, path, toEnd(start, toks, p4)), p4), expectStr(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3)), expectId(toks, p2)), expectId(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1)), expectId(toks, pos)));
var parseImport = _curry6(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => eq5(tokAt(toks, p).tok, TStar) ? _Result_flatMap3((p1) => parseImportNs(toks, start, p1), expectTok(TStar, toks, p)) : _Result_flatMap3((p1) => _Result_flatMap3(([names, p2]) => _Result_flatMap3((p3) => _Result_flatMap3(([kw, p4]) => eq5(kw.name, "from") ? _Result_map3(([path, p5]) => _tuple3(SImport(names, path, toEnd(start, toks, p5)), p5), expectStr(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p4)), expectId(toks, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, expectId, toks, p1)), expectTok(TLbrace, toks, p)), expectTok(TImport, toks, pos));
});
var parseRecordDestructure = _curry6(5, (toks, start, pos, tmp, hooks) => {
  const openSp = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => _Result_flatMap3(([fields, p1]) => ((closeSp) => _Result_flatMap3((p2) => _Result_flatMap3((p3) => _Result_flatMap3(([value, p4]) => ((whole) => ((patSpan2) => ((tmpName) => ((header) => ((access) => Ok5(_tuple3(_Array_prepend2(header, map3(access, fields)), p4, tmp + 1)))((f) => SLet(f.name, f.span, None5, EField(ERef(tmpName, f.span), f.name, false, f.span), false, None5, f.span)))(SLet(tmpName, patSpan2, None5, value, false, None5, whole)))(`$d${show2(tmp)}`))(spanning(openSp, closeSp)))(spanning(start, exprSpan(value))), parseExpr(toks, p3, hooks)), expectTok(TEq, toks, p2)), expectTok(TRbrace, toks, p1)))(spanOf(tokAt(toks, p1))), listUntil(TRbrace, expectId, toks, p)), expectTok(TLbrace, toks, pos));
});
var parseLet = _curry6(4, (toks, pos, tmp, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap3((p) => eq5(tokAt(toks, p).tok, TLbrace) ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap3(([nm, p1]) => _Result_flatMap3(([annot, pA]) => _Result_flatMap3((p2) => _Result_flatMap3(([value, p3]) => Ok5(_tuple3([SLet(nm.name, nm.span, annot, value, false, None5, spanning(start, exprSpan(value)))], p3, tmp)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), eq5(tokAt(toks, p1).tok, TColon) ? _Result_map3(([ty, p2]) => _tuple3(Some5(ty), p2), parseTypeExpr(toks, p1 + 1)) : Ok5(_tuple3(None5, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
});
var setLetMeta = _curry6(3, (exported, doc, s) => match5(s).with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, span }) => SLet(name, nameSpan, annot, value, exported, doc, span)).otherwise((other) => other));
var setTypeMeta = _curry6(3, (exported, doc, s) => match5(s).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var setExternMeta = _curry6(3, (exported, doc, s) => match5(s).with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) => SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span)).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var parseExprStmt = _curry6(4, (toks, pos, tmp, hooks) => {
  const start = tokAt(toks, pos);
  return _Result_flatMap3(([value, p]) => ((p2) => Ok5(_tuple3([SExpr(value, spanning(start, exprSpan(value)))], p2, tmp)))(eq5(tokAt(toks, p).tok, TSemi) ? p + 1 : p), parseExpr(toks, pos, hooks));
});
var parseStmt = _curry6(4, (toks, pos, tmp, hooks) => {
  const lt4 = tokAt(toks, pos);
  const doc = lt4.doc;
  return match5(lt4.tok).with({ _tag: "TImport" }, () => _Result_map3(([s, p]) => _tuple3([s], p, tmp), parseImport(toks, pos))).with({ _tag: "TExport" }, () => match5(tokAt(toks, pos + 1).tok).with({ _tag: "TType" }, () => _Result_map3(([s, p]) => _tuple3([setTypeMeta(true, doc, s)], p, tmp), parseType(toks, pos + 1))).with({ _tag: "TExtern" }, () => _Result_map3(([s, p]) => _tuple3([setExternMeta(true, doc, s)], p, tmp), parseExtern(toks, pos + 1))).with({ _tag: "TLet" }, () => _Result_map3(([stmts, p, tmp2]) => _tuple3(map3(setLetMeta(true, doc), stmts), p, tmp2), parseLet(toks, pos + 1, tmp, hooks))).otherwise(() => errAt("`export` must precede let, type, or extern", tokAt(toks, pos + 1)))).with({ _tag: "TType" }, () => _Result_map3(([s, p]) => _tuple3([setTypeMeta(false, doc, s)], p, tmp), parseType(toks, pos))).with({ _tag: "TExtern" }, () => _Result_map3(([s, p]) => _tuple3([setExternMeta(false, doc, s)], p, tmp), parseExtern(toks, pos))).with({ _tag: "TLet" }, () => _Result_map3(([stmts, p, tmp2]) => _tuple3(map3(setLetMeta(false, doc), stmts), p, tmp2), parseLet(toks, pos, tmp, hooks))).otherwise(() => parseExprStmt(toks, pos, tmp, hooks));
});
var isSyncTok = (t) => match5(t).with({ _tag: "TLet" }, () => true).with({ _tag: "TType" }, () => true).with({ _tag: "TExtern" }, () => true).with({ _tag: "TImport" }, () => true).with({ _tag: "TExport" }, () => true).otherwise(() => false);
var isOpener = (t) => or4(or4(eq5(t, TLparen), eq5(t, TLbrace)), eq5(t, TLbracket));
var isCloser = (t) => or4(or4(eq5(t, TRparen), eq5(t, TRbrace)), eq5(t, TRbracket));
var maxParseErrors = 100;
var resumeAt = _curry6(3, (toks, pos, at) => and4(pos + 1 < length5(toks), tokAt(toks, pos).start < at) ? resumeAt(toks, pos + 1, at) : pos);
var skipToSync = _curry6(3, (toks, pos, depth) => {
  const t = tokAt(toks, pos).tok;
  return or4(eq5(t, TEof), and4(eq5(depth, 0), isSyncTok(t))) ? pos : skipToSync(toks, pos + 1, isOpener(t) ? depth + 1 : and4(isCloser(t), depth > 0) ? depth - 1 : depth);
});
var recoverFrom = _curry6(4, (toks, before, failedAt, at) => {
  const resume = resumeAt(toks, before, at);
  const start = eq5(resume, before) ? before + 1 : resume;
  const final = skipToSync(toks, start, 0);
  return { node: SError({ start: failedAt.start, end: tokAt(toks, final - 1).end }), pos: final };
});
var stmtsLoop = _curry6(6, (toks, pos0, tmp0, acc0, diags0, hooks) => {
  let pos = pos0;
  let tmp = tmp0;
  let acc = acc0;
  let diags = diags0;
  while (true) {
    if (eq5(tokAt(toks, pos).tok, TEof)) {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt = tokAt(toks, pos);
        const _step = match5(parseStmt(toks, pos, tmp, hooks)).with((_v) => {
          const _g = _v;
          return _g._tag === "Ok";
        }, ({ value: [stmts, p, tmp2] }) => eq5(p, pos) ? ((r) => _recur2(r.pos, tmp, _Array_append5(r.node, acc), _Array_append5({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur2(p, tmp2, _Array_concat2(acc, stmts), diags)).with({ _tag: "Err" }, ({ error: d }) => ((ds) => length5(ds) >= maxParseErrors ? _done2({ stmts: _Array_append5(SError({ start: failedAt.start, end: tokAt(toks, length5(toks) - 1).end }), acc), diagnostics: _Array_append5({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur2(r.pos, tmp, _Array_append5(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start)))(_Array_append5(d, diags))).exhaustive();
        if (_step._tag === "recur") {
          [pos, tmp, acc, diags] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  }
});
var parseRecovering = _curry6(2, (toks, pluginsOpt) => {
  const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt));
  return stmtsLoop(toks, match5(tokAt(toks, 0).tok).with({ _tag: "TStr" }, ({ value }) => eq5(value, "use open") ? 1 : 0).otherwise(() => 0), 0, [], [], hooks);
});
var parse = (toks) => parseWith(toks, None5);
var parseWith = _curry6(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return match5(_Array_get4(0, r.diagnostics)).with({ _tag: "Some" }, ({ value: d }) => Err5(d)).with({ _tag: "None" }, () => Ok5(r.stmts)).exhaustive();
});

import { Err as Err7, None as None8, Ok as Ok7, Some as Some8, _Array_append as _Array_append7, _Array_contains as _Array_contains2, _Array_flatMap as _Array_flatMap2, _Array_get as _Array_get7, _Array_head as _Array_head3, _Map_get as _Map_get4, _Map_getOr as _Map_getOr2, _Map_has as _Map_has2, _Map_keys as _Map_keys3, _Map_set as _Map_set3, _Option_isNone, _Option_isSome as _Option_isSome2, _Option_orElse, _Option_unwrapOr as _Option_unwrapOr6, _Result_flatMap as _Result_flatMap5, _Set_add, _Set_fromArray, _Set_has, _Str_codeAt as _Str_codeAt4, _Str_join as _Str_join4, _curry as _curry9, _done as _done4, _recur as _recur4, _tuple as _tuple4, and as and6, eq as eq8, filter as filter3, length as length8, map as map6, not as not6, or as or5, show as show5 } from "@mochi/compiler/runtime";
import { match as match8 } from "@onrails/pattern";

import { Err as Err6, Ok as Ok6, Some as Some6, _Array_get as _Array_get5, _Array_prepend as _Array_prepend3, _Map_has, _Map_set as _Map_set2, _Option_unwrapOr as _Option_unwrapOr4, _Result_flatMap as _Result_flatMap4, _Result_map as _Result_map4, _curry as _curry7, _done as _done3, _recur as _recur3, eq as eq6, filter, length as length6, map as map4, not as not4, show as show3 } from "@mochi/compiler/runtime";
import { match as match6 } from "@onrails/pattern";
var emptyRegistry = { ctors: new Map, types: new Map };
var primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
var keysOfFrom = _curry7(2, (fields, i) => match6(_Array_get5(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_prepend3(_Option_unwrapOr4(`_${show3(i)}`, f.name), keysOfFrom(fields, i + 1))).exhaustive());
var keysOf = (fields) => keysOfFrom(fields, 0);
var builtinSpan = { start: 0, end: 0 };
var builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some6("value"), fieldType: TyName("a", builtinSpan) }] }, { name: "None", fields: [] }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some6("value"), fieldType: TyName("a", builtinSpan) }] }, { name: "Err", fields: [{ name: Some6("error"), fieldType: TyName("e", builtinSpan) }] }] }];
var declaresType = _curry7(3, (stmts, i, name) => match6(_Array_get5(i, stmts)).with({ _tag: "None" }, () => false).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name: n } }) => eq6(n, name) ? true : declaresType(stmts, i + 1, name)).with({ _tag: "Some" }, () => declaresType(stmts, i + 1, name)).exhaustive());
var builtinDeclsFor = (stmts) => filter((bt) => not4(declaresType(stmts, 0, bt.name)), builtinTypeDecls);
var seedRegCtorsFrom = _curry7(4, (ctors, i, owner, acc) => match6(_Array_get5(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => seedRegCtorsFrom(ctors, i + 1, owner, _Map_has(c.name, acc) ? acc : _Map_set2(c.name, { owner, arity: length6(c.fields) }, acc))).exhaustive());
var seedRegDeclsFrom = _curry7(3, (decls, i, reg) => match6(_Array_get5(i, decls)).with({ _tag: "None" }, () => reg).with({ _tag: "Some" }, ({ value: bt }) => seedRegDeclsFrom(decls, i + 1, { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set2(bt.name, map4((c) => c.name, bt.ctors), reg.types) })).exhaustive());
var ctorErr = _curry7(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var ctorsInto = _curry7(5, (ctors, i, owner, sp, acc) => match6(_Array_get5(i, ctors)).with({ _tag: "None" }, () => Ok6(acc)).with({ _tag: "Some" }, ({ value: c }) => _Map_has(c.name, acc) ? Err6(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, i + 1, owner, sp, _Map_set2(c.name, { owner, arity: length6(c.fields) }, acc))).exhaustive());
var buildLoop = _curry7(3, (stmts, i, reg) => match6(_Array_get5(i, stmts)).with({ _tag: "None" }, () => Ok6(reg)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, ctors, span: sp } }) => _Map_has(name, reg.types) ? Err6(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap4((cs) => buildLoop(stmts, i + 1, { ctors: cs, types: _Map_set2(name, map4((c) => c.name, ctors), reg.types) }), ctorsInto(ctors, 0, name, sp, reg.ctors))).with({ _tag: "Some" }, () => buildLoop(stmts, i + 1, reg)).exhaustive());
var buildRegistry = (stmts) => _Result_map4((reg) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg), buildLoop(stmts, 0, emptyRegistry));
var exportedRegLoop = _curry7(3, (stmts, i0, reg0) => {
  let i = i0;
  let reg = reg0;
  while (true) {
    const _step = match6(_Array_get5(i, stmts)).with({ _tag: "None" }, () => _done3(reg)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
    }, ({ value: { name, ctors } }) => _recur3(i + 1, { ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors), types: _Map_set2(name, map4((c) => c.name, ctors), reg.types) })).with({ _tag: "Some" }, () => _recur3(i + 1, reg)).exhaustive();
    if (_step._tag === "recur") {
      [i, reg] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var exportedRegistry = (stmts) => exportedRegLoop(stmts, 0, emptyRegistry);
var ctorKeysInto = _curry7(3, (ctors, i, m) => match6(_Array_get5(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, i + 1, _Map_set2(name, keysOf(fields), m))).exhaustive());
var ctorKeysFrom = _curry7(3, (stmts, i, m) => match6(_Array_get5(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { ctors } }) => ctorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => ctorKeysFrom(stmts, i + 1, m)).exhaustive());
var ctorKeysFromStmts = _curry7(2, (stmts, m) => ctorKeysFrom(stmts, 0, m));
var seedKeyCtorsFrom = _curry7(3, (ctors, i, m) => match6(_Array_get5(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set2(name, keysOf(fields), m))).exhaustive());
var seedKeyDeclsFrom = _curry7(3, (decls, i, m) => match6(_Array_get5(i, decls)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m))).exhaustive());
var seedBuiltinCtorKeys = _curry7(2, (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m));
var exportedCtorKeysFrom = _curry7(3, (stmts, i, m) => match6(_Array_get5(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
}, ({ value: { ctors } }) => exportedCtorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => exportedCtorKeysFrom(stmts, i + 1, m)).exhaustive());
var exportedCtorKeys = (stmts) => exportedCtorKeysFrom(stmts, 0, new Map);

import { None as None7, Some as Some7, _Array_append as _Array_append6, _Array_concat as _Array_concat3, _Array_contains, _Array_drop, _Array_flatMap, _Array_get as _Array_get6, _Array_head as _Array_head2, _Array_prepend as _Array_prepend4, _Array_tail as _Array_tail2, _Array_take, _Map_get as _Map_get3, _Map_getOr, _Map_keys as _Map_keys2, _Option_isSome, _Option_unwrapOr as _Option_unwrapOr5, _Str_concat, _Str_endsWith, _Str_join as _Str_join3, _curry as _curry8, and as and5, eq as eq7, filter as filter2, length as length7, map as map5, not as not5, reduce, show as show4 } from "@mochi/compiler/runtime";
import { match as match7 } from "@onrails/pattern";
var MWild = { _tag: "MWild" };
var MCtor = _curry8(2, (name, args) => ({ _tag: "MCtor", name, args }));
var MBool = (value) => ({ _tag: "MBool", value });
var MNum = (value) => ({ _tag: "MNum", value });
var MStr = (value) => ({ _tag: "MStr", value });
var MTuple = (elems) => ({ _tag: "MTuple", elems });
var MRecord = _curry8(2, (labels, pats) => ({ _tag: "MRecord", labels, pats }));
var MArr = _curry8(2, (elems, rest) => ({ _tag: "MArr", elems, rest }));
var MOpaque = { _tag: "MOpaque" };
var HCtor = (name) => ({ _tag: "HCtor", name });
var HBool = (value) => ({ _tag: "HBool", value });
var HNum = (value) => ({ _tag: "HNum", value });
var HStr = (value) => ({ _tag: "HStr", value });
var HTuple = (arity) => ({ _tag: "HTuple", arity });
var HRecord = { _tag: "HRecord" };
var HArr = (len) => ({ _tag: "HArr", len });
var UNone = (fuel) => ({ _tag: "UNone", fuel });
var USome = _curry8(2, (row, fuel) => ({ _tag: "USome", row, fuel }));
var UFuel = { _tag: "UFuel" };
var ExOk = { _tag: "ExOk" };
var ExWitness = (witness) => ({ _tag: "ExWitness", witness });
var ExFuel = { _tag: "ExFuel" };
var mWilds = (n) => n <= 0 ? [] : _Array_prepend4(MWild, mWilds(n - 1));
var isWildMP = (mp) => match7(mp).with({ _tag: "MWild" }, () => true).otherwise(() => false);
var explodePat = (p) => match7(p).with({ _tag: "PAs" }, ({ pat }) => explodePat(pat)).with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(explodePat, alts)).otherwise(() => [p]);
var toMP = (p) => match7(p).with({ _tag: "PAs" }, ({ pat }) => toMP(pat)).with({ _tag: "PWild" }, () => MWild).with({ _tag: "PUnit" }, () => MWild).with({ _tag: "PBind" }, () => MWild).with({ _tag: "PLit" }, ({ value: v }) => MNum(v)).with({ _tag: "PBool" }, ({ value: v }) => MBool(v)).with({ _tag: "PStr" }, ({ value: v }) => MStr(v)).with({ _tag: "PTuple" }, ({ elems }) => MTuple(map5(toMP, elems))).with({ _tag: "PCtor" }, ({ ctor: name, args }) => MCtor(name, map5(toMP, args))).with({ _tag: "PRecord" }, ({ fields }) => MRecord(map5((f) => f.label, fields), map5((f) => toMP(f.pat), fields))).with({ _tag: "PArr" }, ({ elems, rest }) => MArr(map5(toMP, elems), _Option_isSome(rest))).with({ _tag: "PList" }, () => MOpaque).with({ _tag: "POr" }, () => MOpaque).exhaustive();
var headOf = (mp) => match7(mp).with({ _tag: "MWild" }, () => None7).with({ _tag: "MOpaque" }, () => None7).with({ _tag: "MCtor" }, ({ name: n }) => Some7(HCtor(n))).with({ _tag: "MBool" }, ({ value: v }) => Some7(HBool(v))).with({ _tag: "MNum" }, ({ value: v }) => Some7(HNum(v))).with({ _tag: "MStr" }, ({ value: v }) => Some7(HStr(v))).with({ _tag: "MTuple" }, ({ elems }) => Some7(HTuple(length7(elems)))).with({ _tag: "MRecord" }, () => Some7(HRecord)).with({ _tag: "MArr" }, ({ elems }) => Some7(HArr(length7(elems)))).exhaustive();
var colOf = (m) => _Array_flatMap((row) => match7(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => [hd]).exhaustive(), m);
var headsOf = (col) => _Array_flatMap((mp) => match7(headOf(mp)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: h }) => [h]).exhaustive(), col);
var addLabel = _curry8(2, (acc, l) => _Array_contains(l, acc) ? acc : _Array_append6(l, acc));
var labelsOfMP = _curry8(2, (acc, mp) => match7(mp).with({ _tag: "MRecord" }, ({ labels: ls }) => reduce(addLabel, acc, ls)).otherwise(() => acc));
var recordLabelsOf = (col) => reduce(labelsOfMP, [], col);
var indexOfLabel = _curry8(3, (l, labels, i) => match7(_Array_get6(i, labels)).with({ _tag: "None" }, () => 0 - 1).with({ _tag: "Some" }, ({ value: x }) => eq7(x, l) ? i : indexOfLabel(l, labels, i + 1)).exhaustive());
var fieldOf = _curry8(3, (l, labels, pats) => {
  const i = indexOfLabel(l, labels, 0);
  return i < 0 ? MWild : _Option_unwrapOr5(MWild, _Array_get6(i, pats));
});
var arrShapeStep = _curry8(2, (acc, mp) => match7(mp).with({ _tag: "MArr" }, ({ elems, rest }) => ((n) => rest ? { fixed: acc.fixed, restFrom: match7(acc.restFrom).with({ _tag: "None" }, () => Some7(n)).with({ _tag: "Some" }, ({ value: m }) => Some7(m < n ? m : n)).exhaustive() } : { fixed: _Array_contains(n, acc.fixed) ? acc.fixed : _Array_append6(n, acc.fixed), restFrom: acc.restFrom })(length7(elems))).otherwise(() => acc));
var arrShapeOf = (col) => reduce(arrShapeStep, { fixed: [], restFrom: None7 }, col);
var rangeCovered = _curry8(3, (shape, i, n) => i >= n ? true : and5(_Array_contains(i, shape.fixed), rangeCovered(shape, i + 1, n)));
var arrComplete = (shape) => match7(shape.restFrom).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: r }) => rangeCovered(shape, 0, r)).exhaustive();
var arrMissingLen = _curry8(2, (shape, n) => and5(not5(_Array_contains(n, shape.fixed)), match7(shape.restFrom).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: r }) => n < r).exhaustive()) ? n : arrMissingLen(shape, n + 1));
var rangeArr = _curry8(2, (i, top) => i > top ? [] : _Array_prepend4(i, rangeArr(i + 1, top)));
var arrLengths = (shape) => {
  const top = reduce(_curry8(2, (a, x) => x > a ? x : a), _Option_unwrapOr5(0, shape.restFrom), shape.fixed);
  return rangeArr(0, top);
};
var specializeRow = _curry8(3, (h, mp, labels) => match7(h).with({ _tag: "HCtor" }, ({ name }) => match7(mp).with({ _tag: "MCtor" }, ({ name: n, args }) => eq7(n, name) ? Some7(args) : None7).otherwise(() => None7)).with({ _tag: "HBool" }, ({ value: v }) => match7(mp).with({ _tag: "MBool" }, ({ value: b }) => eq7(b, v) ? Some7([]) : None7).otherwise(() => None7)).with({ _tag: "HNum" }, ({ value: v }) => match7(mp).with({ _tag: "MNum" }, ({ value: x }) => eq7(x, v) ? Some7([]) : None7).otherwise(() => None7)).with({ _tag: "HStr" }, ({ value: v }) => match7(mp).with({ _tag: "MStr" }, ({ value: x }) => eq7(x, v) ? Some7([]) : None7).otherwise(() => None7)).with({ _tag: "HTuple" }, () => match7(mp).with({ _tag: "MTuple" }, ({ elems }) => Some7(elems)).otherwise(() => None7)).with({ _tag: "HRecord" }, () => match7(mp).with({ _tag: "MRecord" }, ({ labels: ls, pats: ps }) => Some7(map5((l) => fieldOf(l, ls, ps), labels))).otherwise(() => None7)).with({ _tag: "HArr" }, ({ len }) => match7(mp).with({ _tag: "MArr" }, ({ elems, rest }) => ((k) => rest ? k <= len ? Some7(_Array_concat3(elems, mWilds(len - k))) : None7 : eq7(k, len) ? Some7(elems) : None7)(length7(elems))).otherwise(() => None7)).exhaustive());
var specializeOne = _curry8(4, (h, arity, labels, row) => match7(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => ((rest) => isWildMP(hd) ? [_Array_concat3(mWilds(arity), rest)] : match7(specializeRow(h, hd, labels)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: sub3 }) => [_Array_concat3(sub3, rest)]).exhaustive())(_Array_tail2(row))).exhaustive());
var specializeM = _curry8(4, (m, h, arity, labels) => _Array_flatMap((row) => specializeOne(h, arity, labels, row), m));
var defaultM = (m) => _Array_flatMap((row) => match7(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => isWildMP(hd) ? [_Array_tail2(row)] : []).exhaustive(), m);
var rebuild = _curry8(3, (h, args, labels) => match7(h).with({ _tag: "HCtor" }, ({ name }) => MCtor(name, args)).with({ _tag: "HTuple" }, () => MTuple(args)).with({ _tag: "HRecord" }, () => MRecord(labels, args)).with({ _tag: "HArr" }, () => MArr(args, false)).with({ _tag: "HBool" }, ({ value: v }) => MBool(v)).with({ _tag: "HNum" }, ({ value: v }) => MNum(v)).with({ _tag: "HStr" }, ({ value: v }) => MStr(v)).exhaustive());
var takenNums = (heads) => _Array_flatMap((h) => match7(h).with({ _tag: "HNum" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var freshNum = _curry8(2, (taken, i) => _Array_contains(i, taken) ? freshNum(taken, i + 1) : i);
var takenStrs = (heads) => _Array_flatMap((h) => match7(h).with({ _tag: "HStr" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var starsOf = (n) => n <= 0 ? "" : _Str_concat("*", starsOf(n - 1));
var freshStr = _curry8(2, (taken, i) => {
  const s = starsOf(i);
  return _Array_contains(s, taken) ? freshStr(taken, i + 1) : s;
});
var ctorNames = (heads) => _Array_flatMap((h) => match7(h).with({ _tag: "HCtor" }, ({ name: n }) => [n]).otherwise(() => []), heads);
var boolVals = (heads) => _Array_flatMap((h) => match7(h).with({ _tag: "HBool" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var ctorInfoSuffixed = _curry8(3, (keys, reg, n) => match7(keys).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => None7).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([k, ...rest]) => _Str_endsWith(`.${n}`, k) ? _Map_get3(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorInfoOf = _curry8(2, (reg, n) => match7(_Map_get3(n, reg.ctors)).with({ _tag: "Some" }, ({ value: info }) => Some7(info)).with({ _tag: "None" }, () => ctorInfoSuffixed(_Map_keys2(reg.ctors), reg, n)).exhaustive());
var arityOfCtor = _curry8(2, (reg, n) => match7(ctorInfoOf(reg, n)).with({ _tag: "None" }, () => 0).with({ _tag: "Some" }, ({ value: info }) => info.arity).exhaustive());
var ownerOfCtor = _curry8(2, (reg, n) => match7(ctorInfoOf(reg, n)).with({ _tag: "None" }, () => None7).with({ _tag: "Some" }, ({ value: info }) => Some7(info.owner)).exhaustive());
var allNamesIn = _curry8(2, (all, names) => reduce(_curry8(2, (acc, n) => and5(acc, _Array_contains(n, names))), true, all));
var useful = _curry8(4, (m, width, reg, fuel) => fuel <= 0 ? UFuel : eq7(width, 0) ? eq7(length7(m), 0) ? USome([], fuel - 1) : UNone(fuel - 1) : eq7(length7(m), 0) ? USome(mWilds(width), fuel - 1) : usefulSplit(m, width, reg, fuel - 1));
var usefulSplit = _curry8(4, (m, width, reg, fuel) => {
  const col = colOf(m);
  const heads = headsOf(col);
  return match7(_Array_head2(heads)).with({ _tag: "None" }, () => prependWitness(MWild, useful(defaultM(m), width - 1, reg, fuel))).with({ _tag: "Some" }, ({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel)).exhaustive();
});
var prependWitness = _curry8(2, (mp, r) => match7(r).with({ _tag: "UFuel" }, () => UFuel).with({ _tag: "UNone" }, ({ fuel: f }) => UNone(f)).with({ _tag: "USome" }, ({ row, fuel: f }) => USome(_Array_prepend4(mp, row), f)).exhaustive());
var tryHeads = _curry8(8, (m, heads, arities, labels, width, reg, fuel, i) => match7(_Array_get6(i, heads)).with({ _tag: "None" }, () => UNone(fuel)).with({ _tag: "Some" }, ({ value: h }) => ((arity) => match7(useful(specializeM(m, h, arity, labels), arity + width - 1, reg, fuel)).with({ _tag: "UFuel" }, () => UFuel).with({ _tag: "UNone" }, ({ fuel: f2 }) => tryHeads(m, heads, arities, labels, width, reg, f2, i + 1)).with({ _tag: "USome" }, ({ row, fuel: f2 }) => USome(_Array_prepend4(rebuild(h, _Array_take(arity, row), labels), _Array_drop(arity, row)), f2)).exhaustive())(_Option_unwrapOr5(0, _Array_get6(i, arities)))).exhaustive());
var usefulHead = _curry8(7, (m, col, heads, h0, width, reg, fuel) => match7(h0).with({ _tag: "HTuple" }, ({ arity }) => tryHeads(m, [HTuple(arity)], [arity], [], width, reg, fuel, 0)).with({ _tag: "HRecord" }, () => ((labels) => tryHeads(m, [HRecord], [length7(labels)], labels, width, reg, fuel, 0))(recordLabelsOf(col))).with({ _tag: "HCtor" }, () => usefulCtor(m, heads, width, reg, fuel)).with({ _tag: "HBool" }, () => usefulBool(m, heads, width, reg, fuel)).with({ _tag: "HArr" }, () => usefulArr(m, col, width, reg, fuel)).with({ _tag: "HNum" }, () => prependWitness(MNum(freshNum(takenNums(heads), 0)), useful(defaultM(m), width - 1, reg, fuel))).with({ _tag: "HStr" }, () => prependWitness(MStr(freshStr(takenStrs(heads), 0)), useful(defaultM(m), width - 1, reg, fuel))).exhaustive());
var usefulCtor = _curry8(5, (m, heads, width, reg, fuel) => {
  const names = ctorNames(heads);
  const ownerOpt = match7(_Array_head2(names)).with({ _tag: "None" }, () => None7).with({ _tag: "Some" }, ({ value: n }) => ownerOfCtor(reg, n)).exhaustive();
  const all = match7(ownerOpt).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: o }) => _Map_getOr([], o, reg.types)).exhaustive();
  return and5(length7(all) > 0, allNamesIn(all, names)) ? tryHeads(m, map5((n) => HCtor(n), all), map5((n) => arityOfCtor(reg, n), all), [], width, reg, fuel, 0) : prependWitness(match7(_Array_head2(filter2((n) => not5(_Array_contains(n, names)), all))).with({ _tag: "None" }, () => MWild).with({ _tag: "Some" }, ({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n)))).exhaustive(), useful(defaultM(m), width - 1, reg, fuel));
});
var usefulBool = _curry8(5, (m, heads, width, reg, fuel) => {
  const vs = boolVals(heads);
  const hasTrue = _Array_contains(true, vs);
  return and5(hasTrue, _Array_contains(false, vs)) ? tryHeads(m, [HBool(true), HBool(false)], [0, 0], [], width, reg, fuel, 0) : prependWitness(MBool(not5(hasTrue)), useful(defaultM(m), width - 1, reg, fuel));
});
var usefulArr = _curry8(5, (m, col, width, reg, fuel) => {
  const shape = arrShapeOf(col);
  return arrComplete(shape) ? ((lens) => tryHeads(m, map5((n) => HArr(n), lens), lens, [], width, reg, fuel, 0))(arrLengths(shape)) : prependWitness(MArr(mWilds(arrMissingLen(shape, 0)), false), useful(defaultM(m), width - 1, reg, fuel));
});
var showFields = _curry8(3, (labels, pats, i) => match7(_Array_get6(i, labels)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: l }) => _Array_prepend4(`${l}: ${showWitness(_Option_unwrapOr5(MWild, _Array_get6(i, pats)))}`, showFields(labels, pats, i + 1))).exhaustive());
var showWitness = (mp) => match7(mp).with({ _tag: "MWild" }, () => "_").with({ _tag: "MOpaque" }, () => "_").with({ _tag: "MBool" }, ({ value: v }) => show4(v)).with({ _tag: "MNum" }, ({ value: v }) => show4(v)).with({ _tag: "MStr" }, ({ value: v }) => show4(v)).with({ _tag: "MCtor" }, ({ name: n, args }) => eq7(length7(args), 0) ? n : `${n}(${_Str_join3(", ", map5(showWitness, args))})`).with({ _tag: "MTuple" }, ({ elems }) => `(${_Str_join3(", ", map5(showWitness, elems))})`).with({ _tag: "MRecord" }, ({ labels, pats }) => `{ ${_Str_join3(", ", showFields(labels, pats, 0))} }`).with({ _tag: "MArr" }, ({ elems, rest }) => `[${_Str_join3(", ", _Array_concat3(map5(showWitness, elems), rest ? ["..."] : []))}]`).exhaustive();
var isWideWitnessM = (mp) => match7(mp).with({ _tag: "MWild" }, () => true).with({ _tag: "MCtor" }, ({ args }) => reduce(_curry8(2, (acc, a) => and5(acc, isWildMP(a))), true, args)).otherwise(() => false);
var checkExhaustiveM = _curry8(2, (patterns, reg) => {
  const rows = _Array_flatMap((p) => map5((alt) => [toMP(alt)], explodePat(p)), patterns);
  return match7(useful(rows, 1, reg, 20000)).with({ _tag: "UFuel" }, () => ExFuel).with({ _tag: "UNone" }, () => ExOk).with({ _tag: "USome" }, ({ row }) => ExWitness(_Option_unwrapOr5(MWild, _Array_head2(row)))).exhaustive();
});

var checkErr = _curry9(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var firstSomeFrom = _curry9(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match8(_Array_get7(i, xs)).with({ _tag: "None" }, () => _done4(None8)).with({ _tag: "Some" }, ({ value: x }) => match8(f(x)).with({ _tag: "Some" }, ({ value: e }) => _done4(Some8(e))).with({ _tag: "None" }, () => _recur4(i + 1)).exhaustive()).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var firstSome = _curry9(2, (f, xs) => firstSomeFrom(f, xs, 0));
var allOfFrom = _curry9(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match8(_Array_get7(i, xs)).with({ _tag: "None" }, () => _done4(true)).with({ _tag: "Some" }, ({ value: x }) => f(x) ? _recur4(i + 1) : _done4(false)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var allOf = _curry9(2, (f, xs) => allOfFrom(f, xs, 0));
var someOfFrom2 = _curry9(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match8(_Array_get7(i, xs)).with({ _tag: "None" }, () => _done4(false)).with({ _tag: "Some" }, ({ value: x }) => f(x) ? _done4(true) : _recur4(i + 1)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var someOf2 = _curry9(2, (f, xs) => someOfFrom2(f, xs, 0));
var exprSpan2 = (e) => match8(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var patSpan2 = (p) => match8(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var isCatchAll = (p) => match8(p).with({ _tag: "PWild" }, () => true).with({ _tag: "PUnit" }, () => true).with({ _tag: "PBind" }, () => true).with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat)).with({ _tag: "PRecord" }, ({ fields }) => allOf((f) => isCatchAll(f.pat), fields)).with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => and6(eq8(length8(elems), 0), _Option_isSome2(rest))).with({ _tag: "PList" }, ({ elems, rest }) => and6(eq8(length8(elems), 0), _Option_isSome2(rest))).otherwise(() => false);
var isPList = (p) => match8(p).with({ _tag: "PList" }, () => true).otherwise(() => false);
var isPCtor = (p) => match8(p).with({ _tag: "PCtor" }, () => true).otherwise(() => false);
var ctorNameOf = (p) => match8(p).with({ _tag: "PCtor" }, ({ ctor: name }) => name).otherwise(() => "");
var patCtorKey = _curry9(2, (ctor, ns) => match8(ns).with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctor}`).with({ _tag: "None" }, () => ctor).exhaustive());
var seqElemsRest = (p) => match8(p).with({ _tag: "PArr" }, ({ elems, rest }) => Some8(_tuple4(elems, rest))).with({ _tag: "PList" }, ({ elems, rest }) => Some8(_tuple4(elems, rest))).otherwise(() => None8);
var checkPattern = _curry9(3, (p, reg, top) => match8(p).with({ _tag: "PAs" }, ({ pat }) => checkPattern(pat, reg, top)).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match8(_Map_get4(key, reg.ctors)).with({ _tag: "None" }, () => Some8(checkErr(`unknown constructor '${key}'`, sp))).with({ _tag: "Some" }, ({ value: info }) => eq8(length8(args), info.arity) ? firstSome((a) => checkPattern(a, reg, false), args) : Some8(checkErr(`constructor '${ctor}' expects ${show5(info.arity)} arg(s), got ${show5(length8(args))}`, sp))).exhaustive())(patCtorKey(ctor, ns))).with({ _tag: "PRecord" }, ({ fields }) => firstSome((f) => checkPattern(f.pat, reg, false), fields)).with({ _tag: "PTuple" }, ({ elems }) => firstSome((el) => checkPattern(el, reg, false), elems)).with({ _tag: "PArr" }, ({ elems, rest }) => _Option_orElse(match8(rest).with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false)).with({ _tag: "None" }, () => None8).exhaustive(), firstSome((el) => checkPattern(el, reg, false), elems))).with({ _tag: "PList" }, ({ elems, rest, span: sp }) => top ? _Option_orElse(match8(rest).with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false)).with({ _tag: "None" }, () => None8).exhaustive(), firstSome((el) => checkPattern(el, reg, false), elems)) : Some8(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp))).with({ _tag: "POr" }, ({ alts, span: sp }) => checkOrPattern(alts, sp, reg)).otherwise(() => None8));
var binderPathsArgs = _curry9(4, (args, i, at, acc) => match8(_Array_get7(i, args)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap5((acc2) => binderPathsArgs(args, i + 1, at, acc2), binderPaths(a, `${at}.a${show5(i)}`, acc))).exhaustive());
var binderPathsFields = _curry9(4, (fields, i, at, acc) => match8(_Array_get7(i, fields)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: f }) => _Result_flatMap5((acc2) => binderPathsFields(fields, i + 1, at, acc2), binderPaths(f.pat, `${at}.${f.label}`, acc))).exhaustive());
var binderPathsElems = _curry9(4, (elems, i, at, acc) => match8(_Array_get7(i, elems)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: e }) => _Result_flatMap5((acc2) => binderPathsElems(elems, i + 1, at, acc2), binderPaths(e, `${at}.t${show5(i)}`, acc))).exhaustive());
var binderPaths = _curry9(3, (p, at, acc) => match8(p).with({ _tag: "PAs" }, ({ pat, name, nameSpan: nameSp }) => _Result_flatMap5((acc1) => _Map_has2(name, acc1) ? Err7(checkErr(`pattern binds '${name}' more than once`, nameSp)) : Ok7(_Map_set3(name, at, acc1)), binderPaths(pat, at, acc))).with({ _tag: "PBind" }, ({ name, span: sp }) => _Map_has2(name, acc) ? Err7(checkErr(`pattern binds '${name}' more than once`, sp)) : Ok7(_Map_set3(name, at, acc))).with({ _tag: "PCtor" }, ({ args }) => binderPathsArgs(args, 0, at, acc)).with({ _tag: "PRecord" }, ({ fields }) => binderPathsFields(fields, 0, at, acc)).with({ _tag: "PTuple" }, ({ elems }) => binderPathsElems(elems, 0, at, acc)).otherwise(() => Ok7(acc)));
var altMapsFrom = _curry9(4, (alts, i, reg, acc) => match8(_Array_get7(i, alts)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: alt }) => isCatchAll(alt) ? Err7(checkErr("an or-pattern alternative can't be a catch-all (`_` or a bare binding)", patSpan2(alt))) : _Option_isSome2(seqElemsRest(alt)) ? Err7(checkErr("array/list patterns can't appear as an or-pattern alternative", patSpan2(alt))) : match8(checkPattern(alt, reg, false)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => _Result_flatMap5((m) => altMapsFrom(alts, i + 1, reg, _Array_append7(m, acc)), binderPaths(alt, "", new Map))).exhaustive()).exhaustive());
var missingNameErr = _curry9(2, (name, sp) => checkErr(`or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`, sp));
var consistentBindsFrom = _curry9(4, (maps, i, ref, sp) => match8(_Array_get7(i, maps)).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: m }) => _Option_orElse(consistentBindsFrom(maps, i + 1, ref, sp), _Option_orElse(firstSome((name) => _Map_has2(name, ref) ? eq8(_Map_getOr2("", name, ref), _Map_getOr2("", name, m)) ? None8 : Some8(checkErr(`or-pattern binds '${name}' at a differing position across alternatives`, sp)) : Some8(missingNameErr(name, sp)), _Map_keys3(m)), firstSome((name) => _Map_has2(name, m) ? None8 : Some8(missingNameErr(name, sp)), _Map_keys3(ref))))).exhaustive());
var checkOrPattern = _curry9(3, (alts, sp, reg) => match8(altMapsFrom(alts, 0, reg, [])).with({ _tag: "Err" }, ({ error: e }) => Some8(e)).with({ _tag: "Ok" }, ({ value: maps }) => match8(_Array_head3(maps)).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp)).exhaustive()).exhaustive());
var armUnguardedCatchAll = (a) => and6(isCatchAll(a.pattern), _Option_isNone(a.guard));
var guardErrs = _curry9(2, (arms, listSwitch) => firstSome((a) => match8(a.guard).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: g }) => or5(isPList(a.pattern), listSwitch) ? Some8(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan2(g))) : None8).exhaustive(), arms));
var firstCatchIdx = _curry9(2, (arms, i0) => {
  let i = i0;
  while (true) {
    const _step = match8(_Array_get7(i, arms)).with({ _tag: "None" }, () => _done4(None8)).with({ _tag: "Some" }, ({ value: a }) => armUnguardedCatchAll(a) ? _done4(Some8(i)) : _recur4(i + 1)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var unreachableAfterCatch = (arms) => match8(firstCatchIdx(arms, 0)).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: i }) => match8(_Array_get7(i + 1, arms)).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: a }) => Some8(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan2(a.pattern)))).exhaustive()).exhaustive();
var SeqNotSeq = { _tag: "SeqNotSeq" };
var SeqTotal = { _tag: "SeqTotal" };
var SeqFail = (e) => ({ _tag: "SeqFail", e });
var checkSeqExhaustive = _curry9(2, (arms, mSpan) => {
  const seqs = map6((a) => a.pattern, filter3((a) => and6(_Option_isNone(a.guard), _Option_isSome2(seqElemsRest(a.pattern))), arms));
  return eq8(length8(seqs), 0) ? SeqNotSeq : ((hasEmpty) => ((hasCons) => and6(hasEmpty, hasCons) ? SeqTotal : SeqFail(checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", mSpan)))(someOf2((p) => match8(seqElemsRest(p)).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [elems, rest] }) => and6(eq8(length8(elems), 1), _Option_isSome2(rest))).with({ _tag: "None" }, () => false).exhaustive(), seqs)))(someOf2((p) => match8(seqElemsRest(p)).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [elems, rest] }) => and6(eq8(length8(elems), 0), _Option_isNone(rest))).with({ _tag: "None" }, () => false).exhaustive(), seqs));
});
var ctorLoop = _curry9(5, (arms, i, reg, owner, covered) => match8(_Array_get7(i, arms)).with({ _tag: "None" }, () => Ok7(_tuple4(owner, covered))).with({ _tag: "Some" }, ({ value: a }) => match8(a.pattern).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match8(_Map_get4(key, reg.ctors)).with({ _tag: "None" }, () => Err7(checkErr(`unknown constructor '${key}'`, sp))).with({ _tag: "Some" }, ({ value: info }) => not6(eq8(length8(args), info.arity)) ? Err7(checkErr(`constructor '${ctor}' expects ${show5(info.arity)} arg(s), got ${show5(length8(args))}`, sp)) : match8(owner).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: own }) => not6(eq8(own, info.owner)))(_g);
}, ({ value: own }) => Err7(checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp))).otherwise(() => ((covered2) => ctorLoop(arms, i + 1, reg, Some8(info.owner), covered2))(and6(allOf(isCatchAll, args), _Option_isNone(a.guard)) ? _Set_add(ctor, covered) : covered))).exhaustive())(patCtorKey(ctor, ns))).otherwise(() => ctorLoop(arms, i + 1, reg, owner, covered))).exhaustive());
var seqVerdict = _curry9(2, (arms, mSpan) => match8(checkSeqExhaustive(arms, mSpan)).with({ _tag: "SeqTotal" }, () => None8).with({ _tag: "SeqFail" }, ({ e }) => Some8(e)).with({ _tag: "SeqNotSeq" }, () => None8).exhaustive());
var unguardedPatterns = (arms) => _Array_flatMap2((a) => _Option_isNone(a.guard) ? [a.pattern] : [], arms);
var namedUnguarded = (leaves) => _Set_fromArray(_Array_flatMap2((a) => and6(isPCtor(a.pattern), _Option_isNone(a.guard)) ? [ctorNameOf(a.pattern)] : [], leaves));
var matrixVerdict = _curry9(5, (arms, leaves, ownerOpt, mSpan, reg) => match8(checkExhaustiveM(unguardedPatterns(arms), reg)).with({ _tag: "ExOk" }, () => None8).with({ _tag: "ExFuel" }, () => Some8(checkErr("switch too complex to prove exhaustive \u2014 add a `_` catch-all arm", mSpan))).with({ _tag: "ExWitness" }, ({ witness: w }) => ((own) => ((named) => ((absent) => and6(and6(isWideWitnessM(w), not6(eq8(own, ""))), length8(absent) > 0) ? Some8(checkErr(`non-exhaustive switch on '${own}': missing ${_Str_join4(", ", absent)}`, mSpan)) : Some8(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan)))(filter3((c) => not6(_Set_has(c, named)), _Map_getOr2([], own, reg.types))))(namedUnguarded(leaves)))(_Option_unwrapOr6("", ownerOpt))).exhaustive());
var leavesOfArm = (a) => match8(a.pattern).with({ _tag: "POr" }, ({ alts }) => map6((alt) => ({ pattern: alt, guard: a.guard }), alts)).otherwise(() => [{ pattern: a.pattern, guard: a.guard }]);
var checkMatch = _curry9(3, (arms, mSpan, reg) => match8(firstSome((a) => checkPattern(a.pattern, reg, true), arms)).with({ _tag: "Some" }, ({ value: e }) => Some8(e)).with({ _tag: "None" }, () => ((listSwitch) => match8(guardErrs(arms, listSwitch)).with({ _tag: "Some" }, ({ value: e }) => Some8(e)).with({ _tag: "None" }, () => match8(unreachableAfterCatch(arms)).with({ _tag: "Some" }, ({ value: e }) => Some8(e)).with({ _tag: "None" }, () => ((hasCatchAll) => ((leaves) => ((ctorArms) => someOf2((a) => isPList(a.pattern), arms) ? hasCatchAll ? None8 : seqVerdict(arms, mSpan) : match8(ctorLoop(ctorArms, 0, reg, None8, _Set_fromArray([]))).with({ _tag: "Err" }, ({ error: e }) => Some8(e)).with((_v) => {
  const _g = _v;
  return _g._tag === "Ok";
}, ({ value: [ownerOpt] }) => matrixVerdict(arms, leaves, ownerOpt, mSpan, reg)).exhaustive())(filter3((a) => isPCtor(a.pattern), leaves)))(_Array_flatMap2(leavesOfArm, arms)))(someOf2(armUnguardedCatchAll, arms))).exhaustive()).exhaustive())(someOf2((a) => and6(isPList(a.pattern), not6(isCatchAll(a.pattern))), arms))).exhaustive());
var checkExpr = _curry9(2, (e, reg) => match8(e).with({ _tag: "ENum" }, () => None8).with({ _tag: "EUnit" }, () => None8).with({ _tag: "EBool" }, () => None8).with({ _tag: "EStr" }, () => None8).with({ _tag: "ERef" }, () => None8).with({ _tag: "ECall" }, ({ fn, args }) => _Option_orElse(firstSome((a) => checkExpr(a, reg), args), checkExpr(fn, reg))).with({ _tag: "ELambda" }, ({ body }) => checkExpr(body, reg)).with({ _tag: "ELetIn" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg))).with({ _tag: "ELetBind" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg))).with({ _tag: "EPipe" }, ({ left, right }) => _Option_orElse(checkExpr(right, reg), checkExpr(left, reg))).with({ _tag: "EDo" }, ({ exprs }) => firstSome((x) => checkExpr(x, reg), exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Option_orElse(checkExpr(elseE, reg), _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg)))).with({ _tag: "EMatch" }, ({ scrutinee, arms, span: sp }) => _Option_orElse(checkMatch(arms, sp, reg), _Option_orElse(firstSome((a) => _Option_orElse(checkExpr(a.body, reg), match8(a.guard).with({ _tag: "Some" }, ({ value: g }) => checkExpr(g, reg)).with({ _tag: "None" }, () => None8).exhaustive()), arms), checkExpr(scrutinee, reg)))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Option_orElse(firstSome((f) => checkExpr(f.value, reg), fields), match8(spread).with({ _tag: "Some" }, ({ value: s }) => checkExpr(s, reg)).with({ _tag: "None" }, () => None8).exhaustive())).with({ _tag: "EField" }, ({ target }) => checkExpr(target, reg)).with({ _tag: "ELoop" }, ({ params, body }) => _Option_orElse(checkExpr(body, reg), firstSome((p) => checkExpr(p.init, reg), params))).with({ _tag: "ERecur" }, ({ args }) => firstSome((a) => checkExpr(a, reg), args)).with({ _tag: "ETuple" }, ({ elements }) => firstSome((el) => checkExpr(el, reg), elements)).with({ _tag: "EArr" }, ({ elements }) => firstSome((el) => checkExpr(match8(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "EList" }, ({ elements }) => firstSome((el) => checkExpr(match8(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "ESet" }, ({ elements }) => firstSome((el) => checkExpr(match8(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "EMap" }, ({ entries }) => firstSome((en) => _Option_orElse(checkExpr(en.value, reg), checkExpr(en.key, reg)), entries)).with({ _tag: "EInterp" }, ({ parts }) => firstSome((p) => match8(p).with({ _tag: "IPLit" }, () => None8).with({ _tag: "IPExpr" }, ({ expr: ex }) => checkExpr(ex, reg)).exhaustive(), parts)).exhaustive());
var reservedNames = ["Array", "List", "Set", "Map", "Option", "Result", "Str"];
var redeclarableTypes = ["Option", "Result"];
var reservedErr = _curry9(2, (name, sp) => checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp));
var checkReservedNames = (stmts) => firstSome((s) => match8(s).with({ _tag: "SType" }, ({ name, span: sp }) => _Array_contains2(name, redeclarableTypes) ? None8 : _Array_contains2(name, reservedNames) ? Some8(reservedErr(name, sp)) : None8).with({ _tag: "SLet" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? Some8(reservedErr(name, sp)) : None8).with({ _tag: "SExtern" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? Some8(reservedErr(name, sp)) : None8).with({ _tag: "SImport" }, ({ names }) => firstSome((n) => _Array_contains2(n.name, reservedNames) ? Some8(checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)) : None8, names)).with({ _tag: "SImportNs" }, ({ alias }) => _Array_contains2(alias.name, reservedNames) ? Some8(checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)) : None8).with({ _tag: "SError" }, () => None8).with({ _tag: "SExpr" }, () => None8).exhaustive(), stmts);
var isUpperStart = (s) => match8(_Str_codeAt4(0, s)).with({ _tag: "Some" }, ({ value: c }) => and6(c >= 65, c <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var strayTypeVar = _curry9(2, (params, te) => match8(te).with({ _tag: "TyName" }, ({ name, span: sp }) => or5(isUpperStart(name), or5(_Array_contains2(name, primTypeNames), _Array_contains2(name, params))) ? None8 : Some8(_tuple4(name, sp))).with({ _tag: "TyArrow" }, ({ from, to }) => _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from))).with({ _tag: "TyApp" }, ({ args }) => firstSome(strayTypeVar(params), args)).with({ _tag: "TyTuple" }, ({ elems }) => firstSome(strayTypeVar(params), elems)).with({ _tag: "TyList" }, ({ elem }) => strayTypeVar(params, elem)).with({ _tag: "TyQual" }, ({ args }) => firstSome(strayTypeVar(params), args)).with({ _tag: "TyLit" }, () => None8).with({ _tag: "TyUnion" }, ({ members }) => firstSome(strayTypeVar(params), members)).exhaustive());
var checkCtorFieldVars = (stmts) => firstSome((s) => match8(s).with({ _tag: "SType" }, ({ name, params, ctors }) => firstSome((c) => firstSome((f) => match8(strayTypeVar(params, f.fieldType)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [vn, vsp] }) => Some8(checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' \u2014 declare it: type ${name} ${_Str_join4(" ", _Array_append7(vn, params))} = ...`, vsp))).with({ _tag: "None" }, () => None8).exhaustive(), c.fields), ctors)).otherwise(() => None8), stmts);
var qualRefsFrom = (te) => match8(te).with({ _tag: "TyName" }, () => []).with({ _tag: "TyArrow" }, ({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)]).with({ _tag: "TyApp" }, ({ args }) => _Array_flatMap2(qualRefsFrom, args)).with({ _tag: "TyTuple" }, ({ elems }) => _Array_flatMap2(qualRefsFrom, elems)).with({ _tag: "TyList" }, ({ elem }) => qualRefsFrom(elem)).with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span: sp }) => [{ alias, name, nameSpan, qualSpan: sp }, ..._Array_flatMap2(qualRefsFrom, args)]).with({ _tag: "TyLit" }, () => []).with({ _tag: "TyUnion" }, ({ members }) => _Array_flatMap2(qualRefsFrom, members)).exhaustive();
var writtenTypeExprs = (stmts) => _Array_flatMap2((s) => match8(s).with({ _tag: "SExtern" }, ({ typeExpr: te }) => [te]).with({ _tag: "SLet" }, ({ annot }) => match8(annot).with({ _tag: "Some" }, ({ value: te }) => [te]).with({ _tag: "None" }, () => []).exhaustive()).with({ _tag: "SType" }, ({ ctors, alias, aliasType }) => [..._Array_flatMap2((c) => map6((f) => f.fieldType, c.fields), ctors), ...match8(alias).with({ _tag: "Some" }, ({ value: fields }) => map6((f) => f.fieldType, fields)).with({ _tag: "None" }, () => []).exhaustive(), ...match8(aliasType).with({ _tag: "Some" }, ({ value: te }) => [te]).with({ _tag: "None" }, () => []).exhaustive()]).otherwise(() => []), stmts);
var emptyQuals = new Map;
var checkQualifiedTypeNames = _curry9(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray(_Array_flatMap2((s) => match8(s).with({ _tag: "SImportNs" }, ({ alias }) => [alias.name]).otherwise(() => []), stmts));
  return firstSome((q) => _Set_has(q.alias, nsAliases) ? match8(_Map_get4(q.alias, quals)).with({ _tag: "None" }, () => None8).with({ _tag: "Some" }, ({ value: dep }) => _Set_has(q.name, dep.types) ? None8 : Some8(checkErr(`module alias '${q.alias}' has no exported type '${q.name}' \u2014 export it from the imported module ('export type ${q.name} = \u2026')`, q.nameSpan))).exhaustive() : Some8(checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' \u2014 a qualified type name needs a matching 'import * as ${q.alias} from "\u2026"'`, q.qualSpan)), _Array_flatMap2(qualRefsFrom, writtenTypeExprs(stmts)));
});
var mergeMissing = _curry9(3, (keys, from, into) => match8(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => match8(_Map_get4(k, from)).with({ _tag: "Some" }, ({ value: v }) => mergeMissing(rest, from, _Map_has2(k, into) ? into : _Map_set3(k, v, into))).with({ _tag: "None" }, () => mergeMissing(rest, from, into)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var checkWith = _curry9(3, (stmts, imported, quals) => match8(checkReservedNames(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match8(checkCtorFieldVars(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match8(checkQualifiedTypeNames(stmts, quals)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => _Result_flatMap5((reg0) => ((reg) => match8(firstSome((s) => match8(s).with({ _tag: "SLet" }, ({ value }) => checkExpr(value, reg)).with({ _tag: "SExpr" }, ({ value }) => checkExpr(value, reg)).otherwise(() => None8), stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => Ok7(stmts)).exhaustive())({ ctors: mergeMissing(_Map_keys3(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys3(imported.types), imported.types, reg0.types) }), buildRegistry(stmts))).exhaustive()).exhaustive()).exhaustive());
var check = (stmts) => checkWith(stmts, { ctors: new Map, types: new Map }, emptyQuals);

import { Err as Err8, None as None11, Ok as Ok8, Some as Some11, _Array_append as _Array_append9, _Array_concat as _Array_concat4, _Array_flatMap as _Array_flatMap3, _Array_get as _Array_get9, _Array_head as _Array_head4, _Array_prepend as _Array_prepend6, _Array_reverse, _Map_delete, _Map_get as _Map_get6, _Map_getOr as _Map_getOr5, _Map_has as _Map_has4, _Map_keys as _Map_keys4, _Map_set as _Map_set6, _Option_map, _Result_flatMap as _Result_flatMap6, _Result_map as _Result_map5, _Set_add as _Set_add4, _Set_fromArray as _Set_fromArray4, _Set_has as _Set_has4, _Set_size, _Set_toArray as _Set_toArray2, _Str_startsWith as _Str_startsWith2, _curry as _curry12, _done as _done6, _recur as _recur6, _tuple as _tuple6, and as and8, eq as eq11, map as map8, not as not7, or as or6, reduce as reduce2 } from "@mochi/compiler/runtime";
import { match as match11 } from "@onrails/pattern";

import { _Array_contains as _Array_contains3, _Array_prepend as _Array_prepend5, _Map_get as _Map_get5, _Map_getOr as _Map_getOr3, _Map_set as _Map_set4, _Map_values, _Set_add as _Set_add2, _Set_diff, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Set_toArray, _Str_codeAt as _Str_codeAt5, _curry as _curry10, _tuple as _tuple5, and as and7, map as map7 } from "@mochi/compiler/runtime";
import { match as match9 } from "@onrails/pattern";
var mono = (t) => ({ vars: [], rvars: [], ty: t });
var tNumber = tPrim("number");
var tBool = tPrim("bool");
var tString = tPrim("string");
var primType = (name) => match9(name).with("float", () => tNumber).with("int", () => tNumber).with("string", () => tString).with("bool", () => tBool).otherwise(() => tPrim(name));
var emptyVarSets = { tv: _Set_fromArray2([]), rv: _Set_fromArray2([]) };
var diffVarSets = _curry10(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
var collect = _curry10(2, (t, acc) => match9(t).with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add2(id, acc.tv), rv: acc.rv })).with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc)).exhaustive());
var collectArgs = _curry10(2, (args, acc) => match9(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectArgs(rest, collect(a, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectRow = _curry10(2, (row, acc) => match9(row).with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add2(id, acc.rv) })).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInType = (t) => collect(t, emptyVarSets);
var collectFree = _curry10(4, (t, bound, st, acc) => match9(t).with({ _tag: "TyVar" }, ({ id }) => _Set_has2(id, bound.tv) ? acc : match9(_Map_get5(id, st.tv)).with({ _tag: "Some" }, ({ value: next }) => collectFree(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: _Set_add2(id, acc.tv), rv: acc.rv })).exhaustive()).with({ _tag: "TyCon" }, ({ args }) => collectFreeArgs(args, bound, st, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collectFree(toT, bound, st, collectFree(fromT, bound, st, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectFreeRow(row, bound, st, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectFreeArgs(members, bound, st, acc)).exhaustive());
var collectFreeArgs = _curry10(4, (args, bound, st, acc) => match9(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectFreeArgs(rest, bound, st, collectFree(a, bound, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectFreeRow = _curry10(4, (row, bound, st, acc) => match9(row).with({ _tag: "RowVar" }, ({ id }) => _Set_has2(id, bound.rv) ? acc : match9(_Map_get5(id, st.rv)).with({ _tag: "Some" }, ({ value: next }) => collectFreeRow(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: acc.tv, rv: _Set_add2(id, acc.rv) })).exhaustive()).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInScheme = _curry10(3, (sc, st, acc) => collectFree(sc.ty, { tv: _Set_fromArray2(sc.vars), rv: _Set_fromArray2(sc.rvars) }, st, acc));
var freeInEnvFrom = _curry10(3, (schemes, st, acc) => match9(schemes).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([sc, ...rest]) => freeInEnvFrom(rest, st, freeInScheme(sc, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeInEnv = _curry10(2, (env, st) => freeInEnvFrom(_Map_values(env), st, emptyVarSets));
var generalize = _curry10(4, (env, t, st, widen) => {
  const zt = widen ? widenLits(zonk(t, st)) : zonk(t, st);
  const free = diffVarSets(freeInType(zt), freeInEnv(env, st));
  return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
});
var widenLits = (t) => match9(t).with({ _tag: "TySingleton", base: "string" }, () => tString).with({ _tag: "TySingleton" }, () => tNumber).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => match9(m).with({ _tag: "TySingleton" }, () => m).otherwise(() => widenLits(m)), members))).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7(widenLits, args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(widenRow(row))).with({ _tag: "TyVar" }, () => t).exhaustive();
var widenRow = (row) => match9(row).with({ _tag: "RowEmpty" }, () => row).with({ _tag: "RowVar" }, () => row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, widenLits(fieldType), widenRow(rest), optional)).exhaustive();
var instMapFrom = _curry10(3, (vars, acc, st) => match9(vars).with((_v) => _v.length === 0, () => _tuple5(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set4(v, fv, acc), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instRowMapFrom = _curry10(3, (vars, acc, st) => match9(vars).with((_v) => _v.length === 0, () => _tuple5(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set4(v, fr, acc), st1))(freshRowVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instSub = _curry10(3, (t, tmap, rmap) => match9(t).with({ _tag: "TyVar" }, ({ id }) => _Map_getOr3(t, id, tmap)).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7((a) => instSub(a, tmap, rmap), args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(instSubRow(row, tmap, rmap))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => instSub(m, tmap, rmap), members))).exhaustive());
var instSubRow = _curry10(3, (row, tmap, rmap) => match9(row).with({ _tag: "RowVar" }, ({ id }) => _Map_getOr3(row, id, rmap)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap), optional)).with({ _tag: "RowEmpty" }, () => row).exhaustive());
var instantiate = _curry10(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => _tuple5(instSub(sc.ty, tmap, rmap), st2))(instRowMapFrom(sc.rvars, new Map, st1)))(instMapFrom(sc.vars, new Map, st)));
var isUpperStart2 = (s) => match9(_Str_codeAt5(0, s)).with({ _tag: "Some" }, ({ value: c }) => and7(c >= 65, c <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var typeExprListToType = _curry10(5, (tes, vars, st, aliases, expanding) => match9(tes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple5([], vars, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => _tuple5(_Array_prepend5(t, restTs), vars2, st2))(typeExprListToType(rest, vars1, st1, aliases, expanding)))(typeExprToType(te, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var typeExprName = _curry10(5, (name, vars, st, aliases, expanding) => _Array_contains3(name, primTypeNames) ? _tuple5(primType(name), vars, st) : match9(_Map_get5(name, vars)).with({ _tag: "Some" }, ({ value: v }) => _tuple5(v, vars, st)).with({ _tag: "None" }, () => match9(_Map_get5(name, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st1]) => _tuple5(t, vars, st1))(aliasRow(name, info, [], st, aliases, expanding))).with({ _tag: "None" }, () => isUpperStart2(name) ? _tuple5(tPrim(name), vars, st) : (([v, st1]) => _tuple5(v, _Map_set4(name, v, vars), st1))(freshVar(st))).exhaustive()).exhaustive());
var typeExprToType = _curry10(5, (te, vars, st, aliases, expanding) => match9(te).with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe }) => (([fromT, vars1, st1]) => (([toT, vars2, st2]) => _tuple5(tArrow(fromT, toT), vars2, st2))(typeExprToType(toTe, vars1, st1, aliases, expanding)))(typeExprToType(fromTe, vars, st, aliases, expanding))).with({ _tag: "TyApp" }, ({ ctor, args: argTes }) => (([args, vars1, st1]) => match9(_Map_get5(ctor, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple5(t, vars1, st2))(aliasRow(ctor, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple5(tCon(ctor, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyTuple" }, ({ elems: elemTes }) => (([elems, vars1, st1]) => _tuple5(tTuple(elems), vars1, st1))(typeExprListToType(elemTes, vars, st, aliases, expanding))).with({ _tag: "TyList" }, ({ elem: elemTe }) => (([elemT, vars1, st1]) => _tuple5(tCon("Array", [elemT]), vars1, st1))(typeExprToType(elemTe, vars, st, aliases, expanding))).with({ _tag: "TyName" }, ({ name }) => typeExprName(name, vars, st, aliases, expanding)).with({ _tag: "TyQual" }, ({ alias, name, args: argTes }) => (([args, vars1, st1]) => match9(_Map_get5(`${alias}.${name}`, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple5(t, vars1, st2))(aliasRow(name, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple5(tCon(name, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyLit" }, ({ value }) => _tuple5(tLit(value), vars, st)).with({ _tag: "TyUnion" }, ({ members }) => (([ts, vars1, st1]) => _tuple5(tUnion(ts), vars1, st1))(typeExprListToType(members, vars, st, aliases, expanding))).exhaustive());
var aliasLocalVarsFrom = _curry10(3, (params, args, st) => match9(params).with((_v) => _v.length === 0, () => _tuple5(new Map, st)).with((_v) => _v.length >= 1, ([p, ...restParams]) => match9(args).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...restArgs]) => (([restMap, st1]) => _tuple5(_Map_set4(p, a, restMap), st1))(aliasLocalVarsFrom(restParams, restArgs, st))).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => (([v, st1]) => (([restMap, st2]) => _tuple5(_Map_set4(p, v, restMap), st2))(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasFieldsFrom = _curry10(5, (fields, vars, st, aliases, expanding) => match9(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple5(RowEmpty, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => _tuple5(rField(fld.name, ft, restRow, fld.optional), st2))(aliasFieldsFrom(rest, vars1, st1, aliases, expanding)))(typeExprToType(fld.fieldType, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasRow = _curry10(6, (name, info, args, st, aliases, expanding) => _Set_has2(name, expanding) ? _tuple5(tCon(name, args), st) : match9(info.expr).with({ _tag: "Some" }, ({ value: te }) => (([local, st1]) => (([t, _, st2]) => _tuple5(t, st2))(typeExprToType(te, local, st1, aliases, _Set_add2(name, expanding))))(aliasLocalVarsFrom(info.params, args, st))).with({ _tag: "None" }, () => (([local, st1]) => {
  const next = _Set_add2(name, expanding);
  return (([row, st2]) => _tuple5(tRecord(row), st2))(aliasFieldsFrom(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st))).exhaustive());
var pvarsFrom = _curry10(2, (params, st) => match9(params).with((_v) => _v.length === 0, () => _tuple5(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple5(_Map_set4(p, v, restMap), _Array_prepend5(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom = _curry10(5, (fields, pvars, st, aliases, result) => match9(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple5(result, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, _, st1]) => (([restT, st2]) => _tuple5(tArrow(ft, restT), st2))(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray2([])))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorScheme = _curry10(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => {
  const result = tCon(typeName, pvarTypes);
  return (([ty, st2]) => {
    const sets = collect(ty, emptyVarSets);
    return _tuple5({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty }, st2);
  })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
})(pvarsFrom(params, st)));

import { _Array_append as _Array_append8, _Array_drop as _Array_drop2, _Array_get as _Array_get8, _Array_take as _Array_take2, _Map_getOr as _Map_getOr4, _Map_has as _Map_has3, _Map_set as _Map_set5, _Set_add as _Set_add3, _Set_diff as _Set_diff2, _Set_fromArray as _Set_fromArray3, _Set_has as _Set_has3, _curry as _curry11, _done as _done5, _recur as _recur5, eq as eq10, length as length9, min } from "@mochi/compiler/runtime";
import { match as match10 } from "@onrails/pattern";
var hasIndex = _curry11(2, (v, st) => _Map_has3(v, st.index));
var indexOfV = _curry11(2, (v, st) => _Map_getOr4(-1, v, st.index));
var lowOfV = _curry11(2, (v, st) => _Map_getOr4(-1, v, st.low));
var neighborsOf = _curry11(2, (v, adj) => match10(_Array_get8(v, adj)).with({ _tag: "Some" }, ({ value: ws }) => ws).with({ _tag: "None" }, () => []).exhaustive());
var indexOfFrom = _curry11(3, (v, xs, i) => {
  let j = i;
  while (true) {
    const _step = match10(_Array_get8(j, xs)).with({ _tag: "None" }, () => _done5(-1)).with({ _tag: "Some" }, ({ value: x }) => eq10(x, v) ? _done5(j) : _recur5(j + 1)).exhaustive();
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var visitNeighbors = _curry11(4, (v, ws, adj, st) => {
  let remaining = ws;
  let current = st;
  while (true) {
    const _step = match10(remaining).with((_v) => {
      const _g = _v;
      return _g.length === 0;
    }, () => _done5(current)).with((_v) => {
      const _g = _v;
      return _g.length >= 1;
    }, ([w, ...rest]) => hasIndex(w, current) ? _Set_has3(w, current.onStack) ? _recur5(rest, { ...current, low: _Map_set5(v, min(lowOfV(v, current), indexOfV(w, current)), current.low) }) : _recur5(rest, current) : ((next) => _recur5(rest, { ...next, low: _Map_set5(v, min(lowOfV(v, next), lowOfV(w, next)), next.low) }))(connect(w, adj, current))).otherwise(() => {
      throw new Error("non-exhaustive match");
    });
    if (_step._tag === "recur") {
      [remaining, current] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var connect = _curry11(3, (v, adj, st) => {
  const st1 = { ...st, index: _Map_set5(v, st.counter, st.index), low: _Map_set5(v, st.counter, st.low), onStack: _Set_add3(v, st.onStack), stack: _Array_append8(v, st.stack), counter: st.counter + 1 };
  const st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1);
  return eq10(lowOfV(v, st2), indexOfV(v, st2)) ? ((start) => ((comp) => ({ ...st2, onStack: _Set_diff2(st2.onStack, _Set_fromArray3(comp)), stack: _Array_take2(start, st2.stack), sccs: _Array_append8(comp, st2.sccs) }))(_Array_drop2(start, st2.stack)))(indexOfFrom(v, st2.stack, 0)) : st2;
});
var connectAllFrom = _curry11(4, (i, n, adj, st) => {
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
  const n = length9(adj);
  const initSt = { index: new Map([]), low: new Map([]), onStack: _Set_fromArray3([]), stack: [], counter: 0, sccs: [] };
  return connectAllFrom(0, n, adj, initSt).sccs;
};

var setLetBindMonad = _curry12(2, ($receiver, $value) => $receiver["monad"] = $value);
var exprSpan3 = (e) => match11(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var patSpan3 = (p) => match11(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var annotSpan = (t) => match11(t).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var typeErr = _curry12(2, (msg, sp) => ({ message: msg, start: sp.start, end: sp.end }));
var u = _curry12(4, (a, b, st, sp) => match11(unify(a, b, st)).with({ _tag: "Ok" }, ({ value: newSt }) => Ok8(newSt)).with({ _tag: "Err" }, ({ error: e }) => Err8(typeErr(e.message, sp))).exhaustive());
var checkFits = _curry12(4, (actual, expected, st, sp) => match11(fits(actual, expected, st)).with({ _tag: "Ok" }, ({ value: newSt }) => Ok8(newSt)).with({ _tag: "Err" }, ({ error: e }) => Err8(typeErr(e.message, sp))).exhaustive());
var bindParamNamesFrom = _curry12(3, (names, env, st) => match11(names).with((_v) => _v.length === 0, () => _tuple6([], env, st)).with((_v) => _v.length >= 1, ([n, ...rest]) => (([t, st1]) => (([restTs, env2, st2]) => _tuple6(_Array_prepend6(t, restTs), env2, st2))(bindParamNamesFrom(rest, _Map_set6(n, mono(t), env), st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParamFieldsFrom = _curry12(4, (fields, env, row, st) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(row, env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => (([ft, st1]) => bindParamFieldsFrom(rest, _Map_set6(f, mono(ft), env), rExtend(f, ft, row), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParam = _curry12(3, (p, env, st) => match11(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => bindParam(inner, env, st)).with({ _tag: "LPName" }, ({ name }) => (([t, st1]) => _tuple6(t, _Map_set6(name, mono(t), env), st1))(freshVar(st))).with({ _tag: "LPTuple" }, ({ names }) => (([elems, env1, st1]) => _tuple6(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st))).with({ _tag: "LPRecord" }, ({ fields }) => (([rowBase, st1]) => (([row, env1, st2]) => _tuple6(tRecord(row), env1, st2))(bindParamFieldsFrom(fields, env, rowBase, st1)))(freshRowVar(st))).with({ _tag: "LPLabeled" }, ({ name }) => (([t, st1]) => _tuple6(t, _Map_set6(name, mono(t), env), st1))(freshVar(st))).exhaustive());
var bindParamsFrom = _curry12(3, (params, env, st) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6([], env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => (([t, env1, st1]) => (([restTs, env2, st2]) => _tuple6(_Array_prepend6(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(bindParam(p, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var constrainParamAnnotsFrom = _curry12(5, (ctx, params, paramTypes, vars, st) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(vars, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([param, ...rest]) => match11(paramTypes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(vars, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([paramT, ...restTypes]) => match11(param).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPName" && _g.param.annot._tag === "Some";
}, ({ param: { annot: { value: te } } }) => (([annotT, vars1, st1]) => _Result_flatMap6((st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2), checkFits(paramT, annotT, st1, annotSpan(te))))(typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray4([])))).otherwise(() => constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var arrowChain = _curry12(2, (paramTypes, resultT) => match11(paramTypes).with((_v) => {
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
var ctxWithEnv = _curry12(2, (ctx, env) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner }));
var ctxWithLets = _curry12(3, (ctx, env, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner }));
var ctxWithLoop = _curry12(4, (ctx, env, frame, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: _Array_prepend6(frame, ctx.loopStack), letOwner }));
var inferLoopParamsFrom = _curry12(7, (ctx, params, i, envAcc, frameAcc, ownerAcc, st) => match11(_Array_get9(i, params)).with({ _tag: "None" }, () => Ok8(_tuple6(frameAcc, envAcc, ownerAcc, st))).with({ _tag: "Some" }, ({ value: p }) => _Result_flatMap6(([t, st1]) => ((sp) => inferLoopParamsFrom(ctx, params, i + 1, _Map_set6(p.name, mono(t), envAcc), _Array_append9(t, frameAcc), _Map_set6(p.name, sp, ownerAcc), noteLet(sp, st1)))(exprSpan3(p.init)), inferExpr(ctx, p.init, st))).exhaustive());
var unifyRecurArgsFrom = _curry12(5, (ctx, args, frame, i, st) => match11(_Array_get9(i, args)).with({ _tag: "None" }, () => Ok8(st)).with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap6(([at, st1]) => match11(_Array_get9(i, frame)).with({ _tag: "None" }, () => unifyRecurArgsFrom(ctx, args, frame, i + 1, st1)).with({ _tag: "Some" }, ({ value: pt }) => _Result_flatMap6((st2) => unifyRecurArgsFrom(ctx, args, frame, i + 1, st2), u(at, pt, st1, exprSpan3(a)))).exhaustive(), inferExpr(ctx, a, st))).exhaustive());
var inferRecur = _curry12(4, (ctx, args, sp, st) => match11(ctx.loopStack).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("'recur' is only legal inside a loop body", sp))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([frame]) => _Result_flatMap6((st1) => (([t, st2]) => Ok8(_tuple6(t, st2)))(freshVar(st1)), unifyRecurArgsFrom(ctx, args, frame, 0, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowHasOptional = (row) => match11(row).with({ _tag: "RowExtend" }, ({ optional, rest }) => or6(optional, rowHasOptional(rest))).otherwise(() => false);
var domainNeedsFits = _curry12(2, (t, st) => match11(zonk(t, st)).with({ _tag: "TyRecord" }, ({ row }) => rowHasOptional(row)).otherwise(() => false));
var rowAllOptional = (row) => match11(row).with({ _tag: "RowExtend" }, ({ optional, rest }) => and8(optional, rowAllOptional(rest))).otherwise(() => true);
var domainIsOmittableRecord = _curry12(2, (t, st) => match11(zonk(t, st)).with({ _tag: "TyRecord" }, ({ row }) => rowAllOptional(row)).otherwise(() => false));
var isLabeledParam2 = (p) => match11(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam2(inner)).otherwise(() => false);
var splitLamParams = _curry12(3, (params, positional, labeled) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(positional, labeled)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam2(p) ? splitLamParams(rest, positional, _Array_append9(p, labeled)) : splitLamParams(rest, _Array_append9(p, positional), labeled)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labFieldsFrom = _curry12(5, (ctx, labs, env, vars, st) => match11(labs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6([], st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([lab, ...rest]) => match11(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => labFieldsFrom(ctx, [inner, ...rest], env, vars, st)).with({ _tag: "LPLabeled" }, ({ name, annot, optional, defaultValue }) => (([fieldT, vars1, st1]) => _Result_flatMap6(([fieldT1, st2]) => ((bodyT) => ((omittable) => _Result_flatMap6(([fields, stN]) => Ok8(_tuple6(_Array_prepend6({ name, fieldType: fieldT1, omittable, bodyType: bodyT }, fields), stN)), labFieldsFrom(ctx, rest, env, vars1, st2)))(or6(optional, match11(defaultValue).with({ _tag: "Some" }, () => true).with({ _tag: "None" }, () => false).exhaustive())))(match11(defaultValue).with({ _tag: "Some" }, () => fieldT1).with({ _tag: "None" }, () => optional ? tCon("Option", [fieldT1]) : fieldT1).exhaustive()), match11(defaultValue).with({ _tag: "None" }, () => Ok8(_tuple6(fieldT, st1))).with({ _tag: "Some" }, ({ value: d }) => _Result_flatMap6(([dt, s2]) => match11(annot).with({ _tag: "Some" }, () => _Result_flatMap6((s3) => Ok8(_tuple6(fieldT, s3)), checkFits(dt, fieldT, s2, exprSpan3(d)))).with({ _tag: "None" }, () => ((widened) => _Result_flatMap6((s3) => Ok8(_tuple6(widened, s3)), u(fieldT, widened, s2, exprSpan3(d))))(widenLits(zonk(dt, s2)))).exhaustive(), inferExpr(ctxWithEnv(ctx, env), d, st1))).exhaustive()))(match11(annot).with({ _tag: "Some" }, ({ value: te }) => typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray4([]))).with({ _tag: "None" }, () => (([t, s1]) => _tuple6(t, vars, s1))(freshVar(st))).exhaustive())).otherwise(() => labFieldsFrom(ctx, rest, env, vars, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowOfLabFields = (fields) => match11(fields).with((_v) => _v.length === 0, () => RowEmpty).with((_v) => _v.length >= 1, ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable)).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var envWithLabFields = _curry12(2, (fields, env) => match11(fields).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([f, ...rest]) => envWithLabFields(rest, _Map_set6(f.name, mono(f.bodyType), env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferCallArgs = _curry12(5, (ctx, fnT, args, st, callSpan) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(fnT, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arg, ...rest]) => _Result_flatMap6(([argT, st1]) => match11(resolve(fnT, st1)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => domainNeedsFits(fromT, st1) ? _Result_flatMap6((st2) => inferCallArgs(ctx, toT, rest, st2, callSpan), checkFits(argT, fromT, st1, exprSpan3(arg))) : (([resultT, st2]) => _Result_flatMap6((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1))).otherwise(() => (([resultT, st2]) => _Result_flatMap6((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1))), inferExpr(ctx, arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferNormalCall = _curry12(4, (ctx, fn, args, st) => _Result_flatMap6(([fnT, st1]) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => match11(resolve(fnT, st1)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => domainIsOmittableRecord(fromT, st1) ? _Result_flatMap6((st2) => Ok8(_tuple6(toT, st2)), checkFits(tRecord(RowEmpty), fromT, st1, exprSpan3(fn))) : (([resultT, st2]) => _Result_flatMap6((st3) => Ok8(_tuple6(resultT, st3)), u(fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1))).otherwise(() => (([resultT, st2]) => _Result_flatMap6((st3) => Ok8(_tuple6(resultT, st3)), u(fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))).otherwise(() => inferCallArgs(ctx, fnT, args, st1, exprSpan3(fn))), inferExpr(ctx, fn, st)));
var inferTernary = _curry12(5, (ctx, cond, thenE, elseE, st) => _Result_flatMap6(([condT, st1]) => _Result_flatMap6((st2) => _Result_flatMap6(([thenT, st3]) => _Result_flatMap6(([elseT, st4]) => _Result_flatMap6((st5) => Ok8(_tuple6(thenT, st5)), u(thenT, elseT, st4, exprSpan3(elseE))), inferExpr(ctx, elseE, st3)), inferExpr(ctx, thenE, st2)), u(condT, tBool, st1, exprSpan3(cond))), inferExpr(ctx, cond, st)));
var inferBindBody = _curry12(7, (ctx, param, paramSpan, body, payloadT, mkBody, st) => (([paramT, bodyEnv, st1]) => _Result_flatMap6((st2) => _Result_flatMap6(([bodyT, st3]) => (([resT, st4]) => {
  const wantBody = mkBody(resT);
  return _Result_flatMap6((st5) => Ok8(_tuple6(wantBody, st5)), u(bodyT, wantBody, st4, exprSpan3(body)));
})(freshVar(st3)), inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2)), u(paramT, payloadT, st1, paramSpan)))(bindParam(param, ctx.env, st)));
var inferTwoSlotBind = _curry12(8, (ctx, param, paramSpan, value, body, valT, ctor, st) => (([payloadT, st1]) => (([errT, st2]) => _Result_flatMap6((st3) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon(ctor, [resT, errT]), st3), u(valT, tCon(ctor, [payloadT, errT]), st2, exprSpan3(value))))(freshVar(st1)))(freshVar(st)));
var inferQuestionBind = _curry12(8, (ctx, bind, param, paramSpan, value, body, valT, st) => match11(resolve(valT, st)).with({ _tag: "TyVar" }, () => (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result"))).with({ _tag: "TyCon" }, ({ name }) => eq11(name, "Option") ? (($written) => (([payloadT, st1]) => _Result_flatMap6((st2) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon("Option", [resT]), st2), u(valT, tCon("Option", [payloadT]), st1, exprSpan3(value))))(freshVar(st)))(setLetBindMonad(bind, "Option")) : eq11(name, "Result") ? (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : Err8(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)))).otherwise(() => Err8(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)))));
var inferLetBind = _curry12(8, (ctx, bind, param, paramSpan, monad, value, body, st) => _Result_flatMap6(([valT, st1]) => eq11(monad, "Task") ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1) : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1), inferExpr(ctx, value, st)));
var inferRecordRow = _curry12(3, (ctx, fields, st) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(RowEmpty, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => _Result_flatMap6(([restRow, st1]) => _Result_flatMap6(([ft, st2]) => Ok8(_tuple6(rExtend(f.name, ft, restRow), st2)), inferExpr(ctx, f.value, st1)), inferRecordRow(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rWithTail = _curry12(2, (row, tail) => match11(row).with({ _tag: "RowEmpty" }, () => tail).with({ _tag: "RowVar" }, ({ id }) => rVar(id)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, fieldType, rWithTail(rest, tail), optional)).exhaustive());
var lookupField = _curry12(2, (row, name) => match11(row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => eq11(label, name) ? Some11(_tuple6(fieldType, optional)) : lookupField(rest, name)).otherwise(() => None11));
var rowEndsEmpty = (row) => match11(row).with({ _tag: "RowEmpty" }, () => true).with({ _tag: "RowExtend" }, ({ rest }) => rowEndsEmpty(rest)).with({ _tag: "RowVar" }, () => false).exhaustive();
var inferFieldAccess = _curry12(5, (ctx, target, name, sp, st) => _Result_flatMap6(([targetT, st1]) => ((zonked) => match11(zonked).with({ _tag: "TyRecord" }, ({ row }) => match11(lookupField(row, name)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [ft, optional] }) => Ok8(_tuple6(optional ? tCon("Option", [ft]) : ft, st1))).with({ _tag: "None" }, () => rowEndsEmpty(row) ? Err8(typeErr(`record missing field '${name}'`, sp)) : inferDuckField(targetT, name, sp, st1)).exhaustive()).otherwise(() => inferDuckField(targetT, name, sp, st1)))(zonk(targetT, st1)), inferExpr(ctx, target, st)));
var inferDuckField = _curry12(4, (targetT, name, sp, st) => (([fieldT, st2]) => (([restRow, st3]) => _Result_flatMap6((st4) => Ok8(_tuple6(fieldT, st4)), u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp)))(freshRowVar(st2)))(freshVar(st)));
var inferNsField = _curry12(5, (ctx, tname, name, sp, st) => match11(_Map_get6(name, _Map_getOr5(new Map, tname, ctx.ns))).with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok8(_tuple6(t, st1)))(instantiate(sc, st))).with({ _tag: "None" }, () => Err8(typeErr(`'${tname}' has no member '${name}'`, sp))).exhaustive());
var inferInterpParts = _curry12(3, (ctx, parts, st) => match11(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPLit";
}, ([, ...rest]) => inferInterpParts(ctx, rest, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPExpr";
}, ([{ expr: ex }, ...rest]) => _Result_flatMap6(([t, st1]) => _Result_flatMap6((st2) => inferInterpParts(ctx, rest, st2), u(t, tString, st1, exprSpan3(ex))), inferExpr(ctx, ex, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferTupleElems = _curry12(3, (ctx, elements, st) => match11(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6([], st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([el, ...rest]) => _Result_flatMap6(([t, st1]) => _Result_flatMap6(([restTs, st2]) => Ok8(_tuple6(_Array_prepend6(t, restTs), st2)), inferTupleElems(ctx, rest, st1)), inferExpr(ctx, el, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seqElemExpr2 = (el) => match11(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var inferSeqSlotsElems = _curry12(5, (ctx, con, elem, elements, st) => match11(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([slot, ...rest]) => ((ex) => _Result_flatMap6(([et, st1]) => ((want) => _Result_flatMap6((st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2), u(want, et, st1, exprSpan3(ex))))(match11(slot).with({ _tag: "SEExpr" }, () => elem).with({ _tag: "SESpread" }, () => tCon(con, [elem])).exhaustive()), inferExpr(ctx, ex, st)))(seqElemExpr2(slot))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferSeqSlots = _curry12(4, (ctx, con, elements, st) => (([elem, st1]) => _Result_flatMap6((st2) => Ok8(_tuple6(tCon(con, [elem]), st2)), inferSeqSlotsElems(ctx, con, elem, elements, st1)))(freshVar(st)));
var inferMapEntries = _curry12(5, (ctx, k, v, entries, st) => match11(entries).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ent, ...rest]) => _Result_flatMap6(([kt, st1]) => _Result_flatMap6((st2) => _Result_flatMap6(([vt, st3]) => _Result_flatMap6((st4) => inferMapEntries(ctx, k, v, rest, st4), u(v, vt, st3, exprSpan3(ent.value))), inferExpr(ctx, ent.value, st2)), u(k, kt, st1, exprSpan3(ent.key))), inferExpr(ctx, ent.key, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferMapExpr = _curry12(3, (ctx, entries, st) => (([k, st1]) => (([v, st2]) => _Result_flatMap6((st3) => Ok8(_tuple6(tCon("Map", [k, v]), st3)), inferMapEntries(ctx, k, v, entries, st2)))(freshVar(st1)))(freshVar(st)));
var mergeBindingMapsFrom = _curry12(3, (keys, src, dest) => match11(keys).with((_v) => _v.length === 0, () => dest).with((_v) => _v.length >= 1, ([k, ...rest]) => match11(_Map_get6(k, src)).with({ _tag: "Some" }, ({ value: v }) => mergeBindingMapsFrom(rest, src, _Map_set6(k, v, dest))).with({ _tag: "None" }, () => mergeBindingMapsFrom(rest, src, dest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeBindingMaps = _curry12(2, (dest, src) => mergeBindingMapsFrom(_Map_keys4(src), src, dest));
var mergeEnvBindingsFrom = _curry12(3, (keys, bindings, env) => match11(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => match11(_Map_get6(k, bindings)).with({ _tag: "Some" }, ({ value: t }) => mergeEnvBindingsFrom(rest, bindings, _Map_set6(k, mono(t), env))).with({ _tag: "None" }, () => mergeEnvBindingsFrom(rest, bindings, env)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeEnvBindings = _curry12(2, (bindings, env) => mergeEnvBindingsFrom(_Map_keys4(bindings), bindings, env));
var inferArms = _curry12(5, (ctx, scrutT, resultT, arms, st) => match11(arms).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arm, ...rest]) => _Result_flatMap6(([patT, bindings, st1]) => _Result_flatMap6((st2) => ((armCtx) => _Result_flatMap6((st3) => _Result_flatMap6(([bodyT, st4]) => _Result_flatMap6((st5) => inferArms(ctx, scrutT, resultT, rest, st5), u(resultT, bodyT, st4, exprSpan3(arm.body))), inferExpr(armCtx, arm.body, st3)), match11(arm.guard).with({ _tag: "None" }, () => Ok8(st2)).with({ _tag: "Some" }, ({ value: g }) => _Result_flatMap6(([guardT, stg]) => u(tBool, guardT, stg, exprSpan3(g)), inferExpr(armCtx, g, st2))).exhaustive()))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))), u(scrutT, patT, st1, patSpan3(arm.pattern))), inferPat(ctx, arm.pattern, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferMatch = _curry12(4, (ctx, scrutinee, arms, st) => _Result_flatMap6(([scrutT, st1]) => (([resultT, st2]) => _Result_flatMap6((st3) => Ok8(_tuple6(resultT, st3)), inferArms(ctx, scrutT, resultT, arms, st2)))(freshVar(st1)), inferExpr(ctx, scrutinee, st)));
var inferExpr = _curry12(3, (ctx, e, st) => _Result_flatMap6(([t, st1]) => Ok8(_tuple6(t, recordAt(exprSpan3(e), t, st1))), inferExprRaw(ctx, e, st)));
var inferExprRaw = _curry12(3, (ctx, e, st) => match11(e).with({ _tag: "ENum" }, () => Ok8(_tuple6(tNumber, st))).with({ _tag: "EUnit" }, () => Ok8(_tuple6(tUnit, st))).with({ _tag: "EBool" }, () => Ok8(_tuple6(tBool, st))).with({ _tag: "EStr" }, ({ value }) => Ok8(_tuple6(tLit(value), st))).with({ _tag: "ERef" }, ({ name, span: sp }) => match11(_Map_get6(name, ctx.env)).with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok8(_tuple6(t, match11(_Map_get6(name, ctx.letOwner)).with({ _tag: "Some" }, ({ value: vsp }) => noteUse(vsp, t, st1)).with({ _tag: "None" }, () => st1).exhaustive())))(instantiate(sc, st))).with({ _tag: "None" }, () => ctx.open ? (([t, st1]) => Ok8(_tuple6(t, st1)))(freshVar(st)) : Err8(typeErr(`unbound variable '${name}'`, sp))).exhaustive()).with({ _tag: "ELambda" }, ({ params, body }) => (([posParams, labParams]) => (([paramTypes, bodyEnv, st1]) => _Result_flatMap6(([annotVars, st2]) => _Result_flatMap6(([labFields, st3]) => ((allTypes) => _Result_flatMap6(([bodyT, st4]) => Ok8(_tuple6(arrowChain(allTypes, bodyT), st4)), inferExpr(ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)), body, st3)))(match11(labParams).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => paramTypes).otherwise(() => _Array_append9(tRecord(rowOfLabFields(labFields)), paramTypes))), labFieldsFrom(ctx, labParams, bodyEnv, annotVars, st2)), constrainParamAnnotsFrom(ctx, posParams, paramTypes, new Map, st1)))(bindParamsFrom(posParams, ctx.env, st)))(splitLamParams(params, [], []))).with({ _tag: "ELetIn" }, ({ name, nameSpan: _nameSpan, value, body, span: _span }) => match11(value).with({ _tag: "ELambda" }, () => ((lets) => ((idxOf) => ((tail) => _Result_flatMap6(([localCtx, localSt]) => inferExpr(localCtx, tail, localSt), processGroupsFrom(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st)))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e))).otherwise(() => _Result_flatMap6(([valT, st1]) => ((sc) => ((vsp) => (($ctx) => inferExpr($ctx, body, noteLet(vsp, st1)))(ctxWithLets(ctx, _Map_set6(name, sc, ctx.env), _Map_set6(name, vsp, ctx.letOwner))))(exprSpan3(value)))(generalize(ctx.env, valT, st1, true)), inferExpr(ctx, value, st)))).with({ _tag: "ELetBind" }, ({ param, paramSpan, monad, value, body }) => inferLetBind(ctx, e, param, paramSpan, monad, value, body, st)).with({ _tag: "ECall" }, ({ fn, args, origin }) => ((api) => _Result_flatMap6((claimed) => match11(claimed).with({ _tag: "Some" }, ({ value: r }) => Ok8(r)).with({ _tag: "None" }, () => inferNormalCall(ctx, fn, args, st)).exhaustive(), runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api)))({ inferExpr: _curry12(2, (e2, st0) => inferExpr(ctx, e2, st0)), unify: u })).with({ _tag: "EPipe", fast: true }, ({ left, right, span: sp }) => match11(right).with({ _tag: "ECall" }, ({ fn: rfn, args: rargs, origin }) => inferExpr(ctx, ECall(rfn, _Array_prepend6(left, rargs), origin, sp), st)).otherwise(() => inferExpr(ctx, ECall(right, [left], None11, sp), st))).with({ _tag: "EPipe" }, ({ left, right, span: sp }) => inferExpr(ctx, ECall(right, [left], None11, sp), st)).with({ _tag: "EDo" }, ({ exprs }) => inferDo(ctx, exprs, st)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => inferTernary(ctx, cond, thenE, elseE, st)).with({ _tag: "ERecord" }, ({ fields, spread, span: sp }) => match11(spread).with({ _tag: "None" }, () => _Result_flatMap6(([row, st1]) => Ok8(_tuple6(tRecord(row), st1)), inferRecordRow(ctx, fields, st))).with({ _tag: "Some" }, ({ value: spreadExpr }) => _Result_flatMap6(([row, st1]) => _Result_flatMap6(([baseT, st2]) => (([tailVar, st3]) => _Result_flatMap6((st4) => Ok8(_tuple6(baseT, st4)), u(baseT, tRecord(rWithTail(row, tailVar)), st3, sp)))(freshRowVar(st2)), inferExpr(ctx, spreadExpr, st1)), inferRecordRow(ctx, fields, st))).exhaustive()).with({ _tag: "EField" }, ({ target, name, span: sp }) => match11(target).with({ _tag: "ERef" }, ({ name: tname }) => and8(_Map_has4(tname, ctx.ns), not7(_Map_has4(tname, ctx.env))) ? inferNsField(ctx, tname, name, sp, st) : inferFieldAccess(ctx, target, name, sp, st)).otherwise(() => inferFieldAccess(ctx, target, name, sp, st))).with({ _tag: "ETuple" }, ({ elements }) => _Result_flatMap6(([elems, st1]) => Ok8(_tuple6(tTuple(elems), st1)), inferTupleElems(ctx, elements, st))).with({ _tag: "EArr" }, ({ elements }) => inferSeqSlots(ctx, "Array", elements, st)).with({ _tag: "EList" }, ({ elements }) => inferSeqSlots(ctx, "List", elements, st)).with({ _tag: "ESet" }, ({ elements }) => inferSeqSlots(ctx, "Set", elements, st)).with({ _tag: "EMap" }, ({ entries }) => inferMapExpr(ctx, entries, st)).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => inferMatch(ctx, scrutinee, arms, st)).with({ _tag: "ELoop" }, ({ params, body }) => _Result_flatMap6(([frame, bodyEnv, bodyOwner, st1]) => inferExpr(ctxWithLoop(ctx, bodyEnv, frame, bodyOwner), body, st1), inferLoopParamsFrom(ctx, params, 0, ctx.env, [], ctx.letOwner, st))).with({ _tag: "ERecur" }, ({ args, span: sp }) => inferRecur(ctx, args, sp, st)).with({ _tag: "EInterp" }, ({ parts }) => _Result_flatMap6((st1) => Ok8(_tuple6(tString, st1)), inferInterpParts(ctx, parts, st))).exhaustive());
var inferDo = _curry12(3, (ctx, exprs, st) => match11(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("internal: empty do block", { start: 0, end: 0 }))).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => inferExpr(ctx, last, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _Result_flatMap6(([_, st1]) => inferDo(ctx, rest, st1), inferExpr(ctx, first, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatRecordFrom = _curry12(5, (ctx, fields, row, bindings, st) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(row, bindings, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => _Result_flatMap6(([subT, subBindings, st1]) => inferPatRecordFrom(ctx, rest, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), st1), inferPat(ctx, f.pat, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatRecord = _curry12(3, (ctx, fields, st) => (([rowBase, st1]) => _Result_flatMap6(([row, bindings, st2]) => Ok8(_tuple6(tRecord(row), bindings, st2)), inferPatRecordFrom(ctx, fields, rowBase, new Map, st1)))(freshRowVar(st)));
var inferPatCtorArgs = _curry12(7, (ctx, ctor, curT, args, st, bindings, sp) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(curT, bindings, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([argPat, ...rest]) => match11(resolve(curT, st)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Result_flatMap6(([subT, subBindings, st1]) => _Result_flatMap6((st2) => inferPatCtorArgs(ctx, ctor, toT, rest, st2, mergeBindingMaps(bindings, subBindings), sp), u(fromT, subT, st1, patSpan3(argPat))), inferPat(ctx, argPat, st))).otherwise(() => Err8(typeErr(`constructor '${ctor}' applied to too many arguments`, sp)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatTupleFrom = _curry12(3, (ctx, elems, st) => match11(elems).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6([], new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ep, ...rest]) => _Result_flatMap6(([t, bindings, st1]) => _Result_flatMap6(([restTs, restBindings, st2]) => Ok8(_tuple6(_Array_prepend6(t, restTs), mergeBindingMaps(restBindings, bindings), st2)), inferPatTupleFrom(ctx, rest, st1)), inferPat(ctx, ep, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatTuple = _curry12(3, (ctx, elems, st) => _Result_flatMap6(([elemTs, bindings, st1]) => Ok8(_tuple6(tTuple(elemTs), bindings, st1)), inferPatTupleFrom(ctx, elems, st)));
var inferSeqPatElems = _curry12(4, (ctx, elem, elems, st) => match11(elems).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ep, ...rest]) => _Result_flatMap6(([subT, subBindings, st1]) => _Result_flatMap6((st2) => _Result_flatMap6(([restBindings, st3]) => Ok8(_tuple6(mergeBindingMaps(restBindings, subBindings), st3)), inferSeqPatElems(ctx, elem, rest, st2)), u(elem, subT, st1, patSpan3(ep))), inferPat(ctx, ep, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferSeqPat = _curry12(5, (ctx, con, elems, restPat, st) => (([elem, st1]) => {
  const seqT = tCon(con, [elem]);
  return _Result_flatMap6(([bindings, st2]) => match11(restPat).with({ _tag: "None" }, () => Ok8(_tuple6(seqT, bindings, st2))).with({ _tag: "Some" }, ({ value: r }) => _Result_flatMap6(([subT, subBindings, st3]) => _Result_flatMap6((st4) => Ok8(_tuple6(seqT, mergeBindingMaps(bindings, subBindings), st4)), u(subT, seqT, st3, patSpan3(r))), inferPat(ctx, r, st2))).exhaustive(), inferSeqPatElems(ctx, elem, elems, st1));
})(freshVar(st)));
var inferPat = _curry12(3, (ctx, p, st) => _Result_flatMap6(([t, bindings, st1]) => Ok8(_tuple6(t, bindings, recordAt(patSpan3(p), t, st1))), inferPatRaw(ctx, p, st)));
var inferPatRaw = _curry12(3, (ctx, p, st) => match11(p).with({ _tag: "PAs" }, ({ pat, name }) => _Result_flatMap6(([t, bindings, st1]) => Ok8(_tuple6(t, _Map_set6(name, t, bindings), st1)), inferPat(ctx, pat, st))).with({ _tag: "PWild" }, () => (([t, st1]) => Ok8(_tuple6(t, new Map, st1)))(freshVar(st))).with({ _tag: "PUnit" }, () => Ok8(_tuple6(tUnit, new Map, st))).with({ _tag: "PLit" }, () => Ok8(_tuple6(tNumber, new Map, st))).with({ _tag: "PBool" }, () => Ok8(_tuple6(tBool, new Map, st))).with({ _tag: "PStr" }, ({ value }) => Ok8(_tuple6(tLit(value), new Map, st))).with({ _tag: "PBind" }, ({ name }) => (([t, st1]) => Ok8(_tuple6(t, _Map_set6(name, t, new Map), st1)))(freshVar(st))).with({ _tag: "PRecord" }, ({ fields }) => inferPatRecord(ctx, fields, st)).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => match11(ns).with({ _tag: "Some" }, ({ value: alias }) => match11(_Map_get6(ctor, _Map_getOr5(new Map, alias, ctx.ns))).with({ _tag: "None" }, () => Err8(typeErr(`'${alias}' has no member '${ctor}'`, sp))).with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))).exhaustive()).with({ _tag: "None" }, () => match11(_Map_get6(ctor, ctx.env)).with({ _tag: "None" }, () => Err8(typeErr(`unknown constructor '${ctor}'`, sp))).with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))).exhaustive()).exhaustive()).with({ _tag: "PTuple" }, ({ elems }) => inferPatTuple(ctx, elems, st)).with({ _tag: "PArr" }, ({ elems, rest }) => inferSeqPat(ctx, "Array", elems, rest, st)).with({ _tag: "PList" }, ({ elems, rest }) => inferSeqPat(ctx, "List", elems, rest, st)).with({ _tag: "POr" }, ({ alts, span: sp }) => inferOrPat(ctx, alts, sp, st)).exhaustive());
var unifyOrPatBinding = _curry12(5, (name, altBindings, bindings, st, sp) => match11(_Map_get6(name, bindings)).with({ _tag: "None" }, () => Ok8(st)).with({ _tag: "Some" }, ({ value: prevT }) => match11(_Map_get6(name, altBindings)).with({ _tag: "None" }, () => Ok8(st)).with({ _tag: "Some" }, ({ value: ty }) => u(prevT, ty, st, sp)).exhaustive()).exhaustive());
var unifyOrPatBindings = _curry12(5, (names, altBindings, bindings, st, sp) => match11(names).with((_v) => _v.length === 0, () => Ok8(st)).with((_v) => _v.length >= 1, ([name, ...rest]) => _Result_flatMap6((st1) => unifyOrPatBindings(rest, altBindings, bindings, st1, sp), unifyOrPatBinding(name, altBindings, bindings, st, sp))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferOrPatAlts = _curry12(6, (ctx, alts, i, t, bindings, st) => match11(_Array_get9(i, alts)).with({ _tag: "None" }, () => Ok8(st)).with({ _tag: "Some" }, ({ value: alt }) => _Result_flatMap6(([altT, altBindings, st1]) => _Result_flatMap6((st2) => _Result_flatMap6((st3) => inferOrPatAlts(ctx, alts, i + 1, t, bindings, st3), unifyOrPatBindings(_Map_keys4(altBindings), altBindings, bindings, st2, patSpan3(alt))), u(t, altT, st1, patSpan3(alt))), inferPat(ctx, alt, st))).exhaustive());
var inferOrPat = _curry12(4, (ctx, alts, sp, st) => match11(alts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("or-pattern needs at least one alternative", sp))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _Result_flatMap6(([t, bindings, st1]) => _Result_flatMap6((st2) => Ok8(_tuple6(t, bindings, st2)), inferOrPatAlts(ctx, rest, 0, t, bindings, st1)), inferPat(ctx, first, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var patternBindsOpt = (rest) => match11(rest).with({ _tag: "Some" }, ({ value: r }) => patternBinds(r)).with({ _tag: "None" }, () => []).exhaustive();
var patternBinds = (p) => match11(p).with({ _tag: "PAs" }, ({ pat, name }) => _Array_append9(name, patternBinds(pat))).with({ _tag: "PBind" }, ({ name }) => [name]).with({ _tag: "PRecord" }, ({ fields }) => _Array_flatMap3((f) => patternBinds(f.pat), fields)).with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap3(patternBinds, args)).with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap3(patternBinds, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap3(patternBinds, elems), patternBindsOpt(rest))).with({ _tag: "PList" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap3(patternBinds, elems), patternBindsOpt(rest))).with({ _tag: "POr" }, ({ alts }) => match11(_Array_head4(alts)).with({ _tag: "Some" }, ({ value: first }) => patternBinds(first)).with({ _tag: "None" }, () => []).exhaustive()).otherwise(() => []);
var addAllFrom = _curry12(2, (names, set) => match11(names).with((_v) => _v.length === 0, () => set).with((_v) => _v.length >= 1, ([n, ...rest]) => addAllFrom(rest, _Set_add4(n, set))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var paramBound = _curry12(2, (p, bound) => match11(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramBound(inner, bound)).with({ _tag: "LPName" }, ({ name }) => _Set_add4(name, bound)).with({ _tag: "LPTuple" }, ({ names }) => addAllFrom(names, bound)).with({ _tag: "LPRecord" }, ({ fields }) => addAllFrom(fields, bound)).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add4(name, bound)).exhaustive());
var lambdaBound = _curry12(2, (params, bound) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => bound).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => lambdaBound(rest, paramBound(p, bound))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labeledDefaultRefs = _curry12(3, (params, bound, acc) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => match11(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => labeledDefaultRefs([inner, ...rest], bound, acc)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
}, ({ defaultValue: { value: d } }) => labeledDefaultRefs(rest, bound, freeRefs(d, bound, acc))).otherwise(() => labeledDefaultRefs(rest, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var loopBound = _curry12(2, (params, bound) => reduce2(_curry12(2, (b, p) => _Set_add4(p.name, b)), bound, params));
var loopInitRefsFrom = _curry12(4, (params, i, bound, acc) => match11(_Array_get9(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom(params, i + 1, bound, freeRefs(p.init, bound, acc))).exhaustive());
var freeRefsList = _curry12(3, (es, bound, acc) => match11(es).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsFields = _curry12(3, (fields, bound, acc) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsEntries = _curry12(3, (entries, bound, acc) => match11(entries).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ent, ...rest]) => freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsInterpParts = _curry12(3, (parts, bound, acc) => match11(parts).with((_v) => {
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
var freeRefsArms = _curry12(3, (arms, bound, acc) => match11(arms).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arm, ...rest]) => ((armBound) => ((acc1) => freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(match11(arm.guard).with({ _tag: "Some" }, ({ value: g }) => freeRefs(g, armBound, acc)).with({ _tag: "None" }, () => acc).exhaustive()))(addAllFrom(patternBinds(arm.pattern), bound))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefs = _curry12(3, (e, bound, acc) => match11(e).with({ _tag: "ENum" }, () => acc).with({ _tag: "EUnit" }, () => acc).with({ _tag: "EBool" }, () => acc).with({ _tag: "EStr" }, () => acc).with({ _tag: "ERef" }, ({ name }) => _Set_has4(name, bound) ? acc : _Set_add4(name, acc)).with({ _tag: "ECall" }, ({ fn, args }) => freeRefsList(args, bound, freeRefs(fn, bound, acc))).with({ _tag: "ELambda" }, ({ params, body }) => freeRefs(body, lambdaBound(params, bound), labeledDefaultRefs(params, bound, acc))).with({ _tag: "ELetIn" }, ({ name, value, body }) => ((valueBound) => ((acc1) => freeRefs(body, _Set_add4(name, bound), acc1))(freeRefs(value, valueBound, acc)))(match11(value).with({ _tag: "ELambda" }, () => _Set_add4(name, bound)).otherwise(() => bound))).with({ _tag: "ELetBind" }, ({ param, value, body }) => ((acc1) => freeRefs(body, paramBound(param, bound), acc1))(freeRefs(value, bound, acc))).with({ _tag: "EPipe" }, ({ left, right }) => freeRefs(right, bound, freeRefs(left, bound, acc))).with({ _tag: "EDo" }, ({ exprs }) => freeRefsList(exprs, bound, acc)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc))).with({ _tag: "ELoop" }, ({ params, body }) => freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc))).with({ _tag: "ERecur" }, ({ args }) => freeRefsList(args, bound, acc)).with({ _tag: "ERecord" }, ({ fields, spread }) => freeRefsFields(fields, bound, match11(spread).with({ _tag: "Some" }, ({ value: s }) => freeRefs(s, bound, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "EField" }, ({ target }) => freeRefs(target, bound, acc)).with({ _tag: "ETuple" }, ({ elements }) => freeRefsList(elements, bound, acc)).with({ _tag: "EArr" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "EList" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "ESet" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "EMap" }, ({ entries }) => freeRefsEntries(entries, bound, acc)).with({ _tag: "EInterp" }, ({ parts }) => freeRefsInterpParts(parts, bound, acc)).exhaustive());
var seedBuiltinsFrom = _curry12(4, (keys, builtins, env, st) => match11(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([n, ...rest]) => match11(_Map_get6(n, builtins)).with({ _tag: "Some" }, ({ value: t }) => seedBuiltinsFrom(rest, builtins, _Map_set6(n, generalize(env, t, st, true), env), st)).with({ _tag: "None" }, () => seedBuiltinsFrom(rest, builtins, env, st)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedBuiltins = _curry12(3, (builtins, env, st) => seedBuiltinsFrom(_Map_keys4(builtins), builtins, env, st));
var seedNsMembersFrom = _curry12(5, (keys, members, env, st, acc) => match11(keys).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([m, ...rest]) => match11(_Map_get6(m, members)).with({ _tag: "Some" }, ({ value: t }) => seedNsMembersFrom(rest, members, env, st, _Map_set6(m, generalize(env, t, st, true), acc))).with({ _tag: "None" }, () => seedNsMembersFrom(rest, members, env, st, acc)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsFrom = _curry12(5, (nsNames, namespaces, env, st, acc) => match11(nsNames).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([nsName, ...rest]) => match11(_Map_get6(nsName, namespaces)).with({ _tag: "Some" }, ({ value: members }) => seedNsFrom(rest, namespaces, env, st, _Map_set6(nsName, seedNsMembersFrom(_Map_keys4(members), members, env, st, new Map), acc))).with({ _tag: "None" }, () => seedNsFrom(rest, namespaces, env, st, acc)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNs = _curry12(3, (namespaces, env, st) => seedNsFrom(_Map_keys4(namespaces), namespaces, env, st, new Map));
var seedNsImportsFrom = _curry12(3, (aliases, nsImports, ns) => match11(aliases).with((_v) => _v.length === 0, () => ns).with((_v) => _v.length >= 1, ([alias, ...rest]) => match11(_Map_get6(alias, nsImports)).with({ _tag: "Some" }, ({ value: members }) => seedNsImportsFrom(rest, nsImports, _Map_set6(alias, members, ns))).with({ _tag: "None" }, () => seedNsImportsFrom(rest, nsImports, ns)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsImports = _curry12(2, (nsImports, ns) => seedNsImportsFrom(_Map_keys4(nsImports), nsImports, ns));
var aliasMapFrom = _curry12(2, (stmts, acc) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.alias._tag === "Some";
}, ({ name, params, alias: { value: fields } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields, expr: None11 }, acc))).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.aliasType._tag === "Some";
}, ({ name, params, aliasType: { value: te } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields: [], expr: Some11(te) }, acc))).otherwise(() => aliasMapFrom(rest, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerCtorsFrom = _curry12(6, (ctors, typeName, params, aliasMap, env, st) => match11(ctors).with((_v) => _v.length === 0, () => _tuple6(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => (([sc, st1]) => registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerUserCtorsFrom = _curry12(4, (stmts, aliasMap, env, st) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SType" }, ({ name, params, ctors }) => (([env1, st1]) => registerUserCtorsFrom(rest, aliasMap, env1, st1))(registerCtorsFrom(ctors, name, params, aliasMap, env, st))).otherwise(() => registerUserCtorsFrom(rest, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorGroup = _curry12(6, (ctors, typeName, params, aliasMap, env, st) => match11(ctors).with((_v) => _v.length === 0, () => _tuple6(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => _Map_has4(c.name, env) ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st) : (([sc, st1]) => registerBuiltinCtorGroup(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorsFrom = _curry12(4, (decls, aliasMap, env, st) => match11(decls).with((_v) => _v.length === 0, () => _tuple6(env, st)).with((_v) => _v.length >= 1, ([d, ...rest]) => (([env1, st1]) => registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerExternsFrom = _curry12(4, (stmts, aliasMap, env, st) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SExtern" }, ({ name, params, typeExpr }) => (([vars, st0]) => (([t, _, st1]) => registerExternsFrom(rest, aliasMap, _Map_set6(name, generalize(env, t, st1, false), env), st1))(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray4([]))))(reduce2(_curry12(2, ([vs, s2], param) => (([v, s1]) => _tuple6(_Map_set6(param, v, vs), s1))(freshVar(s2))), _tuple6(new Map, st), params))).otherwise(() => registerExternsFrom(rest, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var letsOfFrom = (stmts) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SLet" }, () => _Array_prepend6(s, letsOfFrom(rest))).otherwise(() => letsOfFrom(rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var localLetsFrom = (e) => {
  const collect2 = _curry12(2, (current, acc) => match11(current).with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span }) => match11(value).with({ _tag: "ELambda" }, () => collect2(body, _Array_append9(SLet(name, nameSpan, None11, value, false, None11, span), acc))).otherwise(() => acc)).otherwise(() => acc));
  return collect2(e, []);
};
var localTail = (e) => match11(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ELetIn" && _g.value._tag === "ELambda";
}, ({ body }) => localTail(body)).otherwise(() => e);
var idxOfFrom = _curry12(3, (lets, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match11(_Array_get9(i, lets)).with({ _tag: "None" }, () => _done6(acc)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SLet";
    }, ({ value: { name } }) => _recur6(i + 1, _Map_set6(name, i, acc))).with({ _tag: "Some" }, () => _recur6(i + 1, acc)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var idxOfMap = (lets) => idxOfFrom(lets, 0, new Map);
var depsOf = _curry12(2, (letStmt, idxOf) => match11(letStmt).with({ _tag: "SLet" }, ({ value }) => _Array_flatMap3((r) => match11(_Map_get6(r, idxOf)).with({ _tag: "Some" }, ({ value: j }) => [j]).with({ _tag: "None" }, () => []).exhaustive(), _Set_toArray2(freeRefs(value, _Set_fromArray4([]), _Set_fromArray4([]))))).otherwise(() => []));
var adjOf = _curry12(2, (lets, idxOf) => map8((s) => depsOf(s, idxOf), lets));
var groupOfFrom = _curry12(2, (idxs, lets) => match11(idxs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([i, ...rest]) => match11(_Array_get9(i, lets)).with({ _tag: "Some" }, ({ value: s }) => _Array_prepend6(s, groupOfFrom(rest, lets))).with({ _tag: "None" }, () => groupOfFrom(rest, lets)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var preBindGroupFrom = _curry12(3, (group, env, st) => match11(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SLet" }, ({ name }) => (([v, st1]) => preBindGroupFrom(rest, _Map_set6(name, mono(v), env), st1))(freshVar(st))).otherwise(() => preBindGroupFrom(rest, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferGroupFrom = _curry12(3, (ctx, group, st) => match11(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SLet" }, ({ name, annot, value, span }) => _Result_flatMap6(([t, st1]) => match11(_Map_get6(name, ctx.env)).with({ _tag: "Some" }, ({ value: selfSc }) => _Result_flatMap6((st2) => _Result_flatMap6(([pinned, st3]) => _Result_flatMap6(([restTypes, st4]) => Ok8(_tuple6(_Map_set6(name, pinned, restTypes), st4)), inferGroupFrom(ctx, rest, st3)), match11(annot).with({ _tag: "Some" }, ({ value: te }) => (([at, _, stA]) => _Result_map5((stB) => _tuple6(at, stB), checkFits(t, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st2, ctx.aliasMap, _Set_fromArray4([])))).with({ _tag: "None" }, () => Ok8(_tuple6(t, st2))).exhaustive()), u(selfSc.ty, t, st1, span))).with({ _tag: "None" }, () => Err8(typeErr(`internal: missing self-binding for '${name}'`, span))).exhaustive(), inferExpr(ctx, value, st))).otherwise(() => inferGroupFrom(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var dropGroupFrom = _curry12(2, (group, env) => match11(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => env).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SLet" }, ({ name }) => dropGroupFrom(rest, _Map_delete(name, env))).otherwise(() => dropGroupFrom(rest, env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var generalizeGroupFrom = _curry12(4, (group, bodyTypes, env, st) => match11(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => env).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SLet" }, ({ name, annot }) => match11(_Map_get6(name, bodyTypes)).with({ _tag: "Some" }, ({ value: t }) => ((widen) => generalizeGroupFrom(rest, bodyTypes, _Map_set6(name, generalize(env, t, st, widen), env), st))(match11(annot).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, () => false).exhaustive())).with({ _tag: "None" }, () => generalizeGroupFrom(rest, bodyTypes, env, st)).exhaustive()).otherwise(() => generalizeGroupFrom(rest, bodyTypes, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var noteGroupLets = _curry12(3, (group, letOwner, st) => match11(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(letOwner, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with((_v) => {
  const _g = _v;
  return _g._tag === "SLet" && (({ name, value }) => not7(_Str_startsWith2("$", name)))(_g);
}, ({ name, value }) => ((sp) => noteGroupLets(rest, _Map_set6(name, sp, letOwner), noteLet(sp, st)))(exprSpan3(value))).otherwise(() => noteGroupLets(rest, letOwner, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var processGroupsFrom = _curry12(4, (ctx, sccs, lets, st) => match11(sccs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(_tuple6(ctx, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([comp, ...restSccs]) => ((group) => (([preEnv, st1]) => {
  const preCtx = ctxWithEnv(ctx, preEnv);
  return _Result_flatMap6(([bodyTypes, st2]) => ((finalEnv) => (([finalOwner, st3]) => processGroupsFrom(ctxWithLets(ctx, finalEnv, finalOwner), restSccs, lets, st3))(noteGroupLets(group, ctx.letOwner, st2)))(generalizeGroupFrom(group, bodyTypes, dropGroupFrom(group, preEnv), st2)), inferGroupFrom(preCtx, group, st1));
})(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferExprStmtsFrom = _curry12(3, (ctx, stmts, st) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok8(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match11(s).with({ _tag: "SExpr" }, ({ value, span }) => _Result_flatMap6(([t, st1]) => _Result_flatMap6((st2) => inferExprStmtsFrom(ctx, rest, st2), u(t, tUnit, st1, span)), inferExpr(ctx, value, st))).otherwise(() => inferExprStmtsFrom(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedImportsFrom = _curry12(3, (keys, imports, env) => match11(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => match11(_Map_get6(k, imports)).with({ _tag: "Some" }, ({ value: sc }) => seedImportsFrom(rest, imports, _Map_set6(k, sc, env))).with({ _tag: "None" }, () => seedImportsFrom(rest, imports, env)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualifyTe = _curry12(3, (te, alias, from) => match11(te).with({ _tag: "TyName" }, ({ name, span: sp }) => _Map_has4(name, from) ? TyQual(alias, name, sp, [], sp) : te).with({ _tag: "TyApp" }, ({ ctor, args, span: sp }) => ((args1) => _Map_has4(ctor, from) ? TyQual(alias, ctor, sp, args1, sp) : TyApp(ctor, args1, sp))(map8((a) => qualifyTe(a, alias, from), args))).with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe, span: sp }) => TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp)).with({ _tag: "TyTuple" }, ({ elems, span: sp }) => TyTuple(map8((e) => qualifyTe(e, alias, from), elems), sp)).with({ _tag: "TyList" }, ({ elem, span: sp }) => TyList(qualifyTe(elem, alias, from), sp)).with({ _tag: "TyUnion" }, ({ members, span: sp }) => TyUnion(map8((m) => qualifyTe(m, alias, from), members), sp)).otherwise(() => te));
var qualifyField = _curry12(3, (fld, alias, from) => ({ name: fld.name, fieldType: qualifyTe(fld.fieldType, alias, from), optional: fld.optional }));
var qualifyInfo = _curry12(3, (info, alias, from) => ({ params: info.params, fields: map8((f) => qualifyField(f, alias, from), info.fields), expr: _Option_map((te) => qualifyTe(te, alias, from), info.expr) }));
var qualAliasSeedFrom = _curry12(4, (names, alias, from, acc) => match11(names).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([n, ...rest]) => qualAliasSeedFrom(rest, alias, from, match11(_Map_get6(n, from)).with({ _tag: "Some" }, ({ value: info }) => _Map_set6(`${alias}.${n}`, qualifyInfo(info, alias, from), acc)).with({ _tag: "None" }, () => acc).exhaustive())).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualAliasSeed = _curry12(3, (stmts, quals, acc) => match11(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => qualAliasSeed(rest, quals, match11(s).with({ _tag: "SImportNs" }, ({ alias }) => match11(_Map_get6(alias.name, quals)).with({ _tag: "Some" }, ({ value: dep }) => qualAliasSeedFrom(_Map_keys4(dep.aliases), alias.name, dep.aliases, acc)).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var zonkRecorded = _curry12(2, (recorded, st) => map8((r) => ({ span: r.span, ty: zonk(r.ty, st) }), _Array_reverse(recorded)));
var isConcrete = (t) => {
  const f = freeInType(t);
  return and8(eq11(_Set_size(f.tv), 0), eq11(_Set_size(f.rv), 0));
};
var allSameConcreteFrom = _curry12(3, (shown, uses, i) => match11(_Array_get9(i, uses)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: t }) => and8(isConcrete(t), eq11(showType(t), shown)) ? allSameConcreteFrom(shown, uses, i + 1) : false).exhaustive());
var allSameConcrete = _curry12(2, (shown, uses) => allSameConcreteFrom(shown, uses, 0));
var resolveLetParamsFrom = _curry12(2, (keys, st) => match11(keys).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([k, ...rest]) => ((tail) => ((uses) => match11(_Array_get9(0, uses)).with({ _tag: "None" }, () => tail).with({ _tag: "Some" }, ({ value: first }) => allSameConcrete(showType(first), uses) ? match11(_Map_get6(k, st.letSpans)).with({ _tag: "Some" }, ({ value: span }) => _Array_prepend6({ span, ty: first }, tail)).with({ _tag: "None" }, () => tail).exhaustive() : tail).exhaustive())(map8((t) => zonk(t, st), _Map_getOr5([], k, st.letUses))))(resolveLetParamsFrom(rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var resolveLetParams = (st) => resolveLetParamsFrom(_Map_keys4(st.letSpans), st);
var runInferImports = _curry12(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => {
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
    return match11(processGroupsFrom({ env: env4, open: openMode, ns: ns0, aliasMap, plugins, loopStack: [], letOwner: new Map }, sccs, lets, st3)).with((_v) => {
      const _g = _v;
      return _g._tag === "Ok";
    }, ({ value: [finalCtx, st4] }) => match11(inferExprStmtsFrom(finalCtx, stmts, st4)).with({ _tag: "Ok" }, ({ value: st5 }) => Ok8({ env: finalCtx.env, types: zonkRecorded(st5.recorded, st5), aliases: aliasMap, letParams: resolveLetParams(st5) })).with({ _tag: "Err" }, ({ error: e }) => Err8(e)).exhaustive()).with({ _tag: "Err" }, ({ error: e }) => Err8(e)).exhaustive();
  })(registerExternsFrom(stmts, aliasMap, env2, st2)))(registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1)))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
});
var inferProgramImports = _curry12(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => _Result_map5((r) => r.env, runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt)));
var emptyQuals2 = new Map;
var inferProgram = _curry12(4, (stmts, builtins, namespaces, openMode) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None11));
var inferProgramImportsTypes = _curry12(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt));
var inferProgramTypes = _curry12(4, (stmts, builtins, namespaces, openMode) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None11));
var inferProgramWith = _curry12(5, (stmts, builtins, namespaces, openMode, pluginsOpt) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt));
var takeScheme = _curry12(3, (name, env, acc) => match11(_Map_get6(name, env)).with({ _tag: "Some" }, ({ value: sc }) => _Map_set6(name, sc, acc)).with({ _tag: "None" }, () => acc).exhaustive());
var exportCtorsInto = _curry12(4, (ctors, i, env, acc) => match11(_Array_get9(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => exportCtorsInto(ctors, i + 1, env, takeScheme(c.name, env, acc))).exhaustive());
var exportedSchemesFrom = _curry12(4, (stmts, i0, env, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match11(_Array_get9(i, stmts)).with({ _tag: "None" }, () => _done6(acc)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SLet" && _g.value.exported === true;
    }, ({ value: { name } }) => _recur6(i + 1, takeScheme(name, env, acc))).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SExtern" && _g.value.exported === true;
    }, ({ value: { name } }) => _recur6(i + 1, takeScheme(name, env, acc))).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
    }, ({ value: { ctors } }) => _recur6(i + 1, exportCtorsInto(ctors, 0, env, acc))).with({ _tag: "Some" }, () => _recur6(i + 1, acc)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var exportedSchemes = _curry12(2, (stmts, env) => exportedSchemesFrom(stmts, 0, env, new Map));

import { None as None12, Some as Some12, _Array_append as _Array_append10, _Array_concat as _Array_concat5, _Array_get as _Array_get10, _Array_head as _Array_head5, _Array_prepend as _Array_prepend7, _Map_get as _Map_get7, _Map_getOr as _Map_getOr6, _Map_keys as _Map_keys5, _Option_contains as _Option_contains2, _Option_exists as _Option_exists4, _Option_isSome as _Option_isSome3, _Option_unwrapOr as _Option_unwrapOr7, _Set_add as _Set_add5, _Set_fromArray as _Set_fromArray5, _Set_has as _Set_has5, _Set_toArray as _Set_toArray3, _Set_union, _Str_chars, _Str_codeAt as _Str_codeAt6, _Str_concat as _Str_concat2, _Str_endsWith as _Str_endsWith2, _Str_join as _Str_join5, _Str_length as _Str_length3, _Str_replace, _Str_slice as _Str_slice3, _Str_split as _Str_split2, _Str_startsWith as _Str_startsWith3, _curry as _curry13, _done as _done7, _recur as _recur7, _tuple as _tuple7, and as and9, concat, eq as eq12, filter as filter4, length as length10, map as map9, not as not8, or as or7, reduce as reduce3, show as show6 } from "@mochi/compiler/runtime";
import { match as match12 } from "@onrails/pattern";
var jsGenOpts = { annotateLet: None12, annotateCtor: None12, annotateParams: None12, annotateEmpty: None12, annotateLetin: None12, annotateCall: None12, guardBaseType: None12, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", docs: true };
var hook1 = _curry13(2, (h, x) => match12(h).with({ _tag: "None" }, () => None12).with({ _tag: "Some" }, ({ value: f }) => f(x)).exhaustive());
var hook2 = _curry13(3, (h, x, y) => match12(h).with({ _tag: "None" }, () => None12).with({ _tag: "Some" }, ({ value: f }) => f(x, y)).exhaustive());
var emptyNsCtor = _curry13(2, (con, ann) => match12(ann).with({ _tag: "None" }, () => `new ${con}()`).with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`).exhaustive());
var isIdentStart = (c) => or7(or7(or7(and9(c >= 65, c <= 90), and9(c >= 97, c <= 122)), eq12(c, 95)), eq12(c, 36));
var isIdentPart = (c) => or7(isIdentStart(c), and9(c >= 48, c <= 57));
var identPartsFrom = _curry13(2, (s, i) => match12(_Str_codeAt6(i, s)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: c }) => and9(isIdentPart(c), identPartsFrom(s, i + 1))).exhaustive());
var isJsIdent = (s) => match12(_Str_codeAt6(0, s)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: c }) => and9(isIdentStart(c), identPartsFrom(s, 1))).exhaustive();
var isUpperStart3 = (s) => _Option_exists4((n) => and9(n >= 65, n <= 90), _Str_codeAt6(0, s));
var isNullaryCtor = _curry13(2, (name, keys) => _Option_exists4((ks) => eq12(length10(ks), 0), _Map_get7(name, keys)));
var isCtorRef = (fn) => match12(fn).with({ _tag: "ERef" }, ({ name }) => isUpperStart3(name)).otherwise(() => false);
var suffixOr = _curry13(2, (name, ann) => match12(ann).with({ _tag: "None" }, () => name).with({ _tag: "Some" }, ({ value: t }) => `${name}: ${t}`).exhaustive());
var bareParamAnnots = { generics: "", params: [] };
var paramAnnotsFor = _curry13(3, (h, sp, arity) => match12(h).with({ _tag: "None" }, () => bareParamAnnots).with({ _tag: "Some" }, ({ value: f }) => f(sp, arity)).exhaustive());
var annotatedParams = _curry13(3, (cparams, annots, i) => match12(_Array_get10(i, cparams)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: p }) => _Array_prepend7(suffixOr(genParam(p), _Option_unwrapOr7(None12, _Array_get10(i, annots))), annotatedParams(cparams, annots, i + 1))).exhaustive());
var castOr = _curry13(2, (js, ann) => match12(ann).with({ _tag: "None" }, () => js).with({ _tag: "Some" }, ({ value: t }) => `(${js} as ${t})`).exhaustive());
var bindRuntime = (monad) => eq12(monad, "Option") ? "_Option_flatMap" : eq12(monad, "Result") ? "_Result_flatMap" : "_Task_andThen";
var allOfFrom2 = _curry13(3, (f, xs, i) => match12(_Array_get10(i, xs)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: x }) => f(x) ? allOfFrom2(f, xs, i + 1) : false).exhaustive());
var allOf2 = _curry13(2, (f, xs) => allOfFrom2(f, xs, 0));
var someOfFrom3 = _curry13(3, (f, xs, i) => match12(_Array_get10(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => f(x) ? true : someOfFrom3(f, xs, i + 1)).exhaustive());
var someOf3 = _curry13(2, (f, xs) => someOfFrom3(f, xs, 0));
var escChar2 = (c) => match12(c).with("\\", () => "\\\\").with('"', () => "\\\"").with(`
`, () => "\\n").with("\t", () => "\\t").otherwise(() => c);
var jsStringLit = (s) => `"${_Str_join5("", map9(escChar2, _Str_chars(s)))}"`;
var escTemplateLoop = _curry13(3, (chars, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match12(_Array_get10(i, chars)).with({ _tag: "None" }, () => _done7(acc)).with({ _tag: "Some", value: "\\" }, () => _recur7(i + 1, `${acc}\\\\`)).with({ _tag: "Some", value: "`" }, () => _recur7(i + 1, `${acc}\\\``)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "$" && _Option_contains2("{", _Array_get10(i + 1, chars));
    }, () => _recur7(i + 2, `${acc}\\\${`)).with({ _tag: "Some" }, ({ value: c }) => _recur7(i + 1, `${acc}${c}`)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var escapeTemplateLiteral = (s) => escTemplateLoop(_Str_chars(s), 0, "");
var keyAt = _curry13(3, (ctx, ctor, i) => match12(_Map_get7(ctor, ctx.keys)).with({ _tag: "Some" }, ({ value: ks }) => _Option_unwrapOr7(`_${show6(i)}`, _Array_get10(i, ks))).with({ _tag: "None" }, () => `_${show6(i)}`).exhaustive());
var nsRuntimeId = _curry13(3, (ctx, target, name) => match12(target).with({ _tag: "ERef" }, ({ name: refName }) => match12(_Map_get7(refName, ctx.ns)).with({ _tag: "Some" }, ({ value: members }) => _Map_get7(name, members)).with({ _tag: "None" }, () => None12).exhaustive()).otherwise(() => None12));
var emptyNsEmit = _curry13(3, (target, name, ann) => match12(target).with({ _tag: "ERef" }, ({ name: refName }) => eq12(name, "empty") ? eq12(refName, "Set") ? Some12(emptyNsCtor("Set", ann)) : eq12(refName, "Map") ? Some12(emptyNsCtor("Map", ann)) : eq12(refName, "List") ? Some12("_list(function* () {})") : None12 : None12).otherwise(() => None12));
var isLabeledParam3 = (p) => match12(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam3(inner)).otherwise(() => false);
var splitLamParams2 = _curry13(3, (params, positional, labeled) => match12(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(positional, labeled)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam3(p) ? splitLamParams2(rest, positional, _Array_append10(p, labeled)) : splitLamParams2(rest, _Array_append10(p, positional), labeled)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var absorbParams = _curry13(4, (params, acc, fills, labN) => (([positional, labeled]) => {
  const acc1 = _Array_concat5(acc, positional);
  return match12(labeled).with((_v) => {
    const _g = _v;
    return _g.length === 0;
  }, () => _tuple7(acc1, fills, labN)).otherwise(() => ((labVar) => _tuple7(_Array_append10(LPName(labVar, None12), acc1), _Array_append10({ labVar, labs: labeled }, fills), labN + 1))(eq12(labN, 0) ? "$lab" : `$lab${show6(labN)}`));
})(splitLamParams2(params, [], [])));
var collapseLambdaFrom = _curry13(5, (params, body, acc, fills, labN) => (([acc1, fills1, labN1]) => match12(body).with({ _tag: "ELambda" }, ({ params: params2, body: body2 }) => collapseLambdaFrom(params2, body2, acc1, fills1, labN1)).otherwise(() => _tuple7(acc1, body, fills1)))(absorbParams(params, acc, fills, labN)));
var collapseLambda = _curry13(2, (params, body) => collapseLambdaFrom(params, body, [], [], 0));
var tsInfix = _curry13(3, (ctx, fn, args) => not8(ctx.preserveInfix) ? None12 : match12(_tuple7(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ERef" && _g[1].length === 2;
}, ([{ name }, [left, right]]) => match12(name).with("add", () => Some12(`(${genExpr(ctx, left)} + ${genExpr(ctx, right)})`)).with("sub", () => Some12(`(${genExpr(ctx, left)} - ${genExpr(ctx, right)})`)).with("mul", () => Some12(`(${genExpr(ctx, left)} * ${genExpr(ctx, right)})`)).with("div", () => Some12(`(${genExpr(ctx, left)} / ${genExpr(ctx, right)})`)).with("lt", () => Some12(`(${genExpr(ctx, left)} < ${genExpr(ctx, right)})`)).with("lte", () => Some12(`(${genExpr(ctx, left)} <= ${genExpr(ctx, right)})`)).with("gt", () => Some12(`(${genExpr(ctx, left)} > ${genExpr(ctx, right)})`)).with("gte", () => Some12(`(${genExpr(ctx, left)} >= ${genExpr(ctx, right)})`)).otherwise(() => None12)).otherwise(() => None12));
var jsxHasSpread = (children) => match12(children).with((_v) => {
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
var jsxAttrs = _curry13(3, (ctx, fields, spread) => {
  const head = match12(spread).with({ _tag: "None" }, () => "").with({ _tag: "Some" }, ({ value }) => ` {...${genExpr(ctx, value)}}`).exhaustive();
  return `${head}${_Str_join5("", map9((f) => match12(f.value).with({ _tag: "EBool", value: true }, () => ` ${f.name}`).otherwise((value) => ` ${f.name}={${genExpr(ctx, value)}}`), fields))}`;
});
var tsxArgs = _curry13(2, (ctx, args) => match12(args).with((_v) => {
  const _g = _v;
  return _g.length === 3 && _g[1]._tag === "ERecord" && _g[2]._tag === "EArr";
}, ([tag, { fields, spread }, { elements: children }]) => jsxHasSpread(children) ? None12 : ((fragment) => ((name) => ((attrs) => and9(eq12(length10(children), 0), not8(fragment)) ? Some12(`<${name}${attrs} />`) : ((body) => fragment ? Some12(`<>${body}</>`) : Some12(`<${name}${attrs}>${body}</${name}>`))(_Str_join5("", map9((child) => match12(child).with({ _tag: "SEExpr" }, ({ expr: value }) => `{${genExpr(ctx, value)}}`).with({ _tag: "SESpread" }, () => "").exhaustive(), children))))(jsxAttrs(ctx, fields, spread)))(fragment ? "" : match12(tag).with({ _tag: "EStr" }, ({ value }) => value).otherwise(() => genMember(ctx, tag))))(match12(tag).with({ _tag: "EStr", value: "Fragment" }, () => true).otherwise(() => false))).otherwise(() => None12));
var tsxCall = _curry13(4, (ctx, fn, args, origin) => not8(ctx.preserveJsx) ? None12 : match12(origin).with({ _tag: "Some", value: "jsx" }, () => match12(fn).with({ _tag: "ERef", name: "h" }, () => tsxArgs(ctx, args)).otherwise(() => None12)).otherwise(() => None12));
var genExpr = _curry13(2, (ctx, e) => match12(e).with({ _tag: "ENum" }, ({ raw }) => raw).with({ _tag: "EUnit" }, () => "undefined").with({ _tag: "EBool" }, ({ value }) => value ? "true" : "false").with({ _tag: "EStr" }, ({ value }) => jsStringLit(value)).with({ _tag: "ERef" }, ({ name }) => castOr(name, isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : None12)).with({ _tag: "ECall" }, ({ fn, args, origin }) => match12(tsxCall(ctx, fn, args, origin)).with({ _tag: "Some" }, ({ value: jsx }) => jsx).with({ _tag: "None" }, () => match12(tsInfix(ctx, fn, args)).with({ _tag: "Some" }, ({ value: infix }) => infix).with({ _tag: "None" }, () => ((inner) => castOr(inner, isCtorRef(fn) ? hook1(ctx.annotateCall, e) : None12))(`${genCallee(ctx, fn)}(${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))})`)).exhaustive()).exhaustive()).with({ _tag: "ELambda" }, ({ params, body, span: sp }) => (([cparams, cbody, fills]) => {
  const bound = fillNames(fills, paramNameSet(cparams, 0, _Set_fromArray5([])));
  const annots = paramAnnotsFor(ctx.annotateParams, sp, length10(cparams));
  const arrow = `${annots.generics}(${_Str_join5(", ", annotatedParams(cparams, annots.params, 0))}) => ${genLambdaBodyIn(ctx, cbody, bound, genFillDecls(ctx, fills))}`;
  return length10(cparams) >= 2 ? `_curry(${show6(length10(cparams))}, ${arrow})` : arrow;
})(collapseLambda(params, body))).with({ _tag: "ELetIn" }, ({ name, value, body }) => ((param) => `((${param}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(suffixOr(name, hook1(ctx.annotateLetin, value)))).with({ _tag: "ELetBind" }, ({ param, monad, value, body }) => ((rt) => ((f) => ((v) => ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`)(genExpr(ctx, value)))(`(${genParam(param)}) => ${genLambdaBody(ctx, body)}`))(bindRuntime(monad))).with({ _tag: "EPipe" }, ({ left, right, fast, span: sp }) => fast ? match12(right).with({ _tag: "ECall" }, ({ fn: rfn, args: rargs, origin }) => genExpr(ctx, ECall(rfn, _Array_prepend7(left, rargs), origin, sp))).otherwise(() => genExpr(ctx, ECall(right, [left], None12, sp))) : match12(right).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_g);
}, ({ fn: rfn, args: rargs }) => `${genCallee(ctx, rfn)}(${_Str_join5(", ", map9((a) => genExpr(ctx, a), _Array_append10(left, rargs)))})`).otherwise(() => `${genCallee(ctx, right)}(${genExpr(ctx, left)})`)).with({ _tag: "EDo" }, ({ exprs }) => genDo(ctx, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms)).with({ _tag: "ELoop" }, ({ params, body }) => `(() => { ${genLoopBlock(ctx, params, body)} })()`).with({ _tag: "ERecur" }, ({ args }) => `_recur(${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))})`).with({ _tag: "ERecord" }, ({ fields, spread }) => ((fieldStrs) => match12(spread).with({ _tag: "None" }, () => eq12(length10(fields), 0) ? "{}" : `{ ${fieldStrs} }`).with({ _tag: "Some" }, ({ value: s }) => ((spreadStr) => eq12(length10(fields), 0) ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`)(`...${genExpr(ctx, s)}`)).exhaustive())(_Str_join5(", ", map9((f) => `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr(ctx, f.value)}`, fields)))).with({ _tag: "EField" }, ({ target, name, optional }) => match12(emptyNsEmit(target, name, hook1(ctx.annotateEmpty, e))).with({ _tag: "Some" }, ({ value: js }) => js).with({ _tag: "None" }, () => match12(nsRuntimeId(ctx, target, name)).with({ _tag: "Some" }, ({ value: rt }) => rt).with({ _tag: "None" }, () => ((member) => optional ? `((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(${member})` : member)(`${genMember(ctx, target)}.${name}`)).exhaustive()).exhaustive()).with({ _tag: "ETuple" }, ({ elements }) => ((elems) => ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`)(_Str_join5(", ", map9((el) => genExpr(ctx, el), elements)))).with({ _tag: "EArr" }, ({ elements }) => ((body) => castOr(body, eq12(length10(elements), 0) ? hook1(ctx.annotateEmpty, e) : None12))(`[${_Str_join5(", ", map9((el) => genSeqSlot(ctx, el), elements))}]`)).with({ _tag: "EList" }, ({ elements }) => genList(ctx, elements)).with({ _tag: "ESet" }, ({ elements }) => `new Set([${_Str_join5(", ", map9((el) => genSeqSlot(ctx, el), elements))}])`).with({ _tag: "EMap" }, ({ entries }) => match12(eq12(length10(entries), 0) ? hook1(ctx.annotateEmpty, e) : None12).with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`).with({ _tag: "None" }, () => `new Map([${_Str_join5(", ", map9((en) => `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`, entries))}])`).exhaustive()).with({ _tag: "EInterp" }, ({ parts }) => ((body) => `\`${body}\``)(_Str_join5("", map9((p) => match12(p).with({ _tag: "IPLit" }, ({ value }) => escapeTemplateLiteral(value)).with({ _tag: "IPExpr" }, ({ expr: ex }) => `\${${genExpr(ctx, ex)}}`).exhaustive(), parts)))).exhaustive());
var genDo = _curry13(2, (ctx, exprs) => `(() => { ${genDoSteps(ctx, exprs)} })()`);
var genDoSteps = _curry13(2, (ctx, exprs) => match12(exprs).with((_v) => {
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
var genSeqSlot = _curry13(2, (ctx, el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: ex }) => genExpr(ctx, ex)).with({ _tag: "SESpread" }, ({ expr: ex }) => `...${genExpr(ctx, ex)}`).exhaustive());
var genList = _curry13(2, (ctx, elements) => {
  const yields = _Str_join5(" ", map9((el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: ex }) => `yield (${genExpr(ctx, ex)});`).with({ _tag: "SESpread" }, ({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`).exhaustive(), elements));
  return `_list(function* () {${eq12(yields, "") ? "" : ` ${yields} `}})`;
});
var genParam = (p) => match12(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => genParam(inner)).with({ _tag: "LPName" }, ({ name }) => name).with({ _tag: "LPTuple" }, ({ names }) => `[${_Str_join5(", ", names)}]`).with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join5(", ", fields)} }`).with({ _tag: "LPLabeled" }, ({ name }) => name).exhaustive();
var genCallee = _curry13(2, (ctx, e) => match12(e).with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var genMember = _curry13(2, (ctx, e) => match12(e).with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`).with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var seqElemExpr3 = (el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var hasRecur = (e) => match12(e).with({ _tag: "ERecur" }, () => true).with({ _tag: "ELoop" }, () => false).with({ _tag: "ELambda" }, () => false).with({ _tag: "ELetBind" }, () => false).with({ _tag: "EInterp" }, ({ parts }) => someOf3((p) => match12(p).with({ _tag: "IPExpr" }, ({ expr: x }) => hasRecur(x)).with({ _tag: "IPLit" }, () => false).exhaustive(), parts)).with({ _tag: "ECall" }, ({ fn, args }) => or7(hasRecur(fn), someOf3(hasRecur, args))).with({ _tag: "ELetIn" }, ({ value, body }) => or7(hasRecur(value), hasRecur(body))).with({ _tag: "EPipe" }, ({ left, right }) => or7(hasRecur(left), hasRecur(right))).with({ _tag: "EDo" }, ({ exprs }) => someOf3(hasRecur, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or7(hasRecur(cond), or7(hasRecur(thenE), hasRecur(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or7(hasRecur(scrutinee), someOf3((a) => or7(match12(a.guard).with({ _tag: "Some" }, ({ value: g }) => hasRecur(g)).with({ _tag: "None" }, () => false).exhaustive(), hasRecur(a.body)), arms))).with({ _tag: "ERecord" }, ({ fields, spread }) => or7(match12(spread).with({ _tag: "Some" }, ({ value: sp }) => hasRecur(sp)).with({ _tag: "None" }, () => false).exhaustive(), someOf3((f) => hasRecur(f.value), fields))).with({ _tag: "EField" }, ({ target }) => hasRecur(target)).with({ _tag: "ETuple" }, ({ elements }) => someOf3(hasRecur, elements)).with({ _tag: "EArr" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "EList" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "ESet" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "EMap" }, ({ entries }) => someOf3((en) => or7(hasRecur(en.key), hasRecur(en.value)), entries)).otherwise(() => false);
var loopNeedsStep = (e) => match12(e).with({ _tag: "ETernary" }, ({ thenE, elseE }) => or7(loopNeedsStep(thenE), loopNeedsStep(elseE))).with({ _tag: "ELetIn" }, ({ body }) => loopNeedsStep(body)).with({ _tag: "EDo" }, ({ exprs }) => loopNeedsStep(lastDoExpr(exprs))).with({ _tag: "EMatch" }, () => hasRecur(e)).otherwise(() => false);
var lastDoExpr = (exprs) => match12(exprs).with((_v) => {
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
var wrapStepTails = _curry13(2, (e, sp) => match12(e).with({ _tag: "ERecur" }, () => e).with({ _tag: "ETernary" }, ({ cond, thenE, elseE, span: tsp }) => ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp)).with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span: lsp }) => ELetIn(name, nameSpan, value, wrapStepTails(body, sp), lsp)).with({ _tag: "EDo" }, ({ exprs, span: dsp }) => EDo(wrapDoStepTail(exprs, sp), dsp)).with({ _tag: "EMatch" }, ({ scrutinee, arms, span: msp }) => EMatch(scrutinee, map9((a) => ({ pattern: a.pattern, guard: a.guard, body: wrapStepTails(a.body, sp) }), arms), msp)).otherwise(() => ECall(ERef("_done", sp), [e], None12, sp)));
var wrapDoStepTail = _curry13(2, (exprs, sp) => match12(exprs).with((_v) => {
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
var genLoopTail = _curry13(3, (ctx, e, params) => match12(e).with({ _tag: "ERecur" }, ({ args }) => match12(_tuple7(params, args)).with((_v) => {
  const _g = _v;
  return _g[0].length === 1 && _g[1].length === 1;
}, ([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`).otherwise(() => `[${loopParamNames(params)}] = [${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))}]; continue;`)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => hasRecur(e) ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "ELetIn" }, ({ name, value, body }) => hasRecur(e) ? `{ const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "EDo" }, ({ exprs }) => hasRecur(e) ? `{ ${genDoLoopTail(ctx, exprs, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "EMatch" }, ({ span: sp }) => hasRecur(e) ? ((step) => ((rebind) => `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(match12(params).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([p]) => `${p.name} = _step.args[0];`).otherwise(() => `[${loopParamNames(params)}] = _step.args;`)))(genExpr(ctx, wrapStepTails(e, sp))) : `return ${genExpr(ctx, e)};`).otherwise(() => `return ${genExpr(ctx, e)};`));
var genDoLoopTail = _curry13(3, (ctx, exprs, params) => match12(exprs).with((_v) => {
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
var genLoopBlock = _curry13(3, (ctx, params, body) => {
  const decls = _Str_join5(" ", map9((p) => `let ${suffixOr(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr(ctx, p.init)};`, params));
  return `${decls} while (true) { ${genLoopTail(ctx, body, params)} }`;
});
var loopParamFree = _curry13(3, (params, i, seen) => match12(_Array_get10(i, params)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: p }) => _Set_has5(p.name, seen) ? false : loopParamFree(params, i + 1, seen)).exhaustive());
var genLambdaBody = _curry13(2, (ctx, e) => match12(e).with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var paramNames = (p) => match12(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramNames(inner)).with({ _tag: "LPName" }, ({ name }) => [name]).with({ _tag: "LPTuple" }, ({ names }) => names).with({ _tag: "LPRecord" }, ({ fields }) => fields).with({ _tag: "LPLabeled" }, ({ name }) => [name]).exhaustive();
var genLabeledFill = _curry13(3, (ctx, labVar, lab) => match12(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => genLabeledFill(ctx, labVar, inner)).with({ _tag: "LPLabeled" }, ({ name, optional, defaultValue }) => ((access) => match12(defaultValue).with({ _tag: "Some" }, ({ value: d }) => `const ${name} = ${access} != null ? ${access} : ${genExpr(ctx, d)};`).with({ _tag: "None" }, () => optional ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };` : `const ${name} = ${access};`).exhaustive())(`(${labVar} ?? {}).${name}`)).otherwise(() => ""));
var genFillDecls = _curry13(2, (ctx, fills) => match12(fills).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => "").otherwise(() => `${_Str_join5(" ", map9((g) => _Str_join5(" ", map9((lab) => genLabeledFill(ctx, g.labVar, lab), g.labs)), fills))} `));
var fillNames = _curry13(2, (fills, acc) => match12(fills).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([g, ...rest]) => fillNames(rest, reduce3(_curry13(2, (s, lab) => match12(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => match12(inner).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add5(name, s)).otherwise(() => s)).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add5(name, s)).otherwise(() => s)), acc, g.labs))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var addNames = _curry13(3, (names, i, acc) => match12(_Array_get10(i, names)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: n }) => addNames(names, i + 1, _Set_add5(n, acc))).exhaustive());
var paramNameSet = _curry13(3, (params, i, acc) => match12(_Array_get10(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => paramNameSet(params, i + 1, addNames(paramNames(p), 0, acc))).exhaustive());
var letBlockLoop = _curry13(4, (ctx, e, seen, decls) => match12(e).with({ _tag: "ELetIn" }, ({ name, value, body }) => or7(_Set_has5(name, seen), match12(value).with({ _tag: "ELambda" }, () => false).otherwise(() => _Set_has5(name, exprRefs(ctx, value, _Set_fromArray5([]))))) ? _tuple7(decls, e, seen) : letBlockLoop(ctx, body, _Set_add5(name, seen), _Array_append10(`const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)};`, decls))).otherwise(() => _tuple7(decls, e, seen)));
var genLambdaBodyIn = _curry13(4, (ctx, e, bound, prefix) => (([decls, rest, seen]) => eq12(length10(decls), 0) ? match12(e).with({ _tag: "ELoop" }, ({ params, body }) => loopParamFree(params, 0, bound) ? `{ ${prefix}${genLoopBlock(ctx, params, body)} }` : eq12(prefix, "") ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`).otherwise(() => eq12(prefix, "") ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`) : ((block) => match12(rest).with({ _tag: "ELoop" }, ({ params, body }) => loopParamFree(params, 0, seen) ? `{ ${prefix}${block} ${genLoopBlock(ctx, params, body)} }` : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`).otherwise(() => `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`))(_Str_join5(" ", decls)))(letBlockLoop(ctx, e, bound, [])));
var isCatchAll2 = (p) => match12(p).with({ _tag: "PAs" }, ({ pat }) => isCatchAll2(pat)).with({ _tag: "PWild" }, () => true).with({ _tag: "PUnit" }, () => true).with({ _tag: "PBind" }, () => true).with({ _tag: "PRecord" }, ({ fields }) => allOf2((f) => isCatchAll2(f.pat), fields)).with({ _tag: "PTuple" }, ({ elems }) => allOf2(isCatchAll2, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => and9(eq12(length10(elems), 0), _Option_isSome3(rest))).with({ _tag: "PList" }, ({ elems, rest }) => and9(eq12(length10(elems), 0), _Option_isSome3(rest))).otherwise(() => false);
var isPList2 = (p) => match12(p).with({ _tag: "PList" }, () => true).otherwise(() => false);
var keyedSlot = _curry13(2, (key, sub4) => eq12(sub4, key) ? key : `${key}: ${sub4}`);
var pctorEntries = _curry13(4, (ctx, ctor, args, i) => match12(_Array_get10(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => ((s) => ((restEntries) => eq12(s, "") ? restEntries : _Array_prepend7(keyedSlot(keyAt(ctx, ctor, i), s), restEntries))(pctorEntries(ctx, ctor, args, i + 1)))(patSlot(ctx, a))).exhaustive());
var precordEntries = _curry13(3, (ctx, fields, i) => match12(_Array_get10(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((s) => ((restEntries) => eq12(s, "") ? restEntries : _Array_prepend7(keyedSlot(f.label, s), restEntries))(precordEntries(ctx, fields, i + 1)))(patSlot(ctx, f.pat))).exhaustive());
var patSlot = _curry13(2, (ctx, p) => match12(p).with({ _tag: "PAs" }, ({ pat, name }) => ((inner) => eq12(inner, "") ? name : `${inner}, ${name}`)(patSlot(ctx, pat))).with({ _tag: "PBind" }, ({ name }) => name).with({ _tag: "PWild" }, () => "").with({ _tag: "PUnit" }, () => "").with({ _tag: "PLit" }, () => "").with({ _tag: "PBool" }, () => "").with({ _tag: "PStr" }, () => "").with({ _tag: "PList" }, () => "").with({ _tag: "PCtor" }, ({ ctor, args }) => ((entries) => eq12(length10(entries), 0) ? "" : `{ ${_Str_join5(", ", entries)} }`)(pctorEntries(ctx, ctor, args, 0))).with({ _tag: "PRecord" }, ({ fields }) => ((entries) => eq12(length10(entries), 0) ? "" : `{ ${_Str_join5(", ", entries)} }`)(precordEntries(ctx, fields, 0))).with({ _tag: "PTuple" }, ({ elems }) => ((slots) => someOf3((s) => not8(eq12(s, "")), slots) ? `[${_Str_join5(", ", slots)}]` : "")(map9((el) => patSlot(ctx, el), elems))).with({ _tag: "PArr" }, ({ elems, rest }) => ((slots) => ((slots2) => someOf3((s) => not8(eq12(s, "")), slots2) ? `[${_Str_join5(", ", slots2)}]` : "")(match12(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => _Array_append10(`...${name}`, slots)).otherwise(() => slots)))(map9((el) => patSlot(ctx, el), elems))).with({ _tag: "POr" }, ({ alts }) => match12(_Array_head5(alts)).with({ _tag: "Some" }, ({ value: first }) => patSlot(ctx, first)).with({ _tag: "None" }, () => "").exhaustive()).exhaustive());
var pctorConds = _curry13(5, (ctx, ctor, args, i, path) => match12(_Array_get10(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => _Array_concat5(patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`), pctorConds(ctx, ctor, args, i + 1, path))).exhaustive());
var precordConds = _curry13(4, (ctx, fields, i, path) => match12(_Array_get10(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_concat5(patConds(ctx, f.pat, `${path}.${f.label}`), precordConds(ctx, fields, i + 1, path))).exhaustive());
var ptupleConds = _curry13(4, (ctx, elems, i, path) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `${path}[${show6(i)}]`), ptupleConds(ctx, elems, i + 1, path))).exhaustive());
var parrConds = _curry13(4, (ctx, elems, i, path) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `${path}[${show6(i)}]`), parrConds(ctx, elems, i + 1, path))).exhaustive());
var patConds = _curry13(3, (ctx, p, path) => match12(p).with({ _tag: "PAs" }, ({ pat }) => patConds(ctx, pat, path)).with({ _tag: "PWild" }, () => []).with({ _tag: "PUnit" }, () => []).with({ _tag: "PBind" }, () => []).with({ _tag: "PList" }, () => []).with({ _tag: "PLit" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PBool" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PStr" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PCtor" }, ({ ctor, args }) => _Array_prepend7(`${path}._tag === ${jsStringLit(ctor)}`, pctorConds(ctx, ctor, args, 0, path))).with({ _tag: "PRecord" }, ({ fields }) => precordConds(ctx, fields, 0, path)).with({ _tag: "PTuple" }, ({ elems }) => ptupleConds(ctx, elems, 0, path)).with({ _tag: "PArr" }, ({ elems, rest }) => _Array_prepend7(`${path}.length ${_Option_isSome3(rest) ? ">=" : "==="} ${show6(length10(elems))}`, parrConds(ctx, elems, 0, path))).with({ _tag: "POr" }, ({ alts }) => ((altCond) => [_Str_join5(" || ", map9((alt) => `(${altCond(alt)})`, alts))])((alt) => {
  const conds = patConds(ctx, alt, path);
  return eq12(length10(conds), 0) ? "true" : _Str_join5(" && ", map9((c) => `(${c})`, conds));
})).exhaustive());
var catchAllParam = _curry13(2, (ctx, p) => match12(p).with({ _tag: "PArr" }, ({ rest }) => match12(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => `(${name})`).otherwise(() => "()")).with({ _tag: "PList" }, ({ rest }) => match12(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => `(${name})`).otherwise(() => "()")).otherwise(() => ((slot) => eq12(slot, "") ? "()" : `(${slot})`)(patSlot(ctx, p))));
var isListMatch = (arms) => someOf3((a) => and9(isPList2(a.pattern), not8(isCatchAll2(a.pattern))), arms);
var listTail = (from) => concat(concat(concat("_list(function* () { for (let _i = ", show6(from)), "; _i < _b.length; _i++) yield _b[_i]; "), "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })");
var listArmGuards = _curry13(3, (ctx, elems, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `_b[${show6(i)}]`), listArmGuards(ctx, elems, i + 1))).exhaustive());
var listArmBinds = _curry13(3, (ctx, elems, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => _tuple7([], [])).with({ _tag: "Some" }, ({ value: el }) => (([restParams, restArgs]) => {
  const slot = patSlot(ctx, el);
  return eq12(slot, "") ? _tuple7(restParams, restArgs) : _tuple7(_Array_prepend7(slot, restParams), _Array_prepend7(`_b[${show6(i)}]`, restArgs));
})(listArmBinds(ctx, elems, i + 1))).exhaustive());
var genListArm = _curry13(3, (ctx, p, body) => match12(p).with({ _tag: "PList" }, ({ elems, rest }) => ((n) => ((guards) => ((head) => ((cond) => (([params0, args0]) => (([params, args]) => `  if (${cond}) return ((${_Str_join5(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join5(", ", args)});`)(match12(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => _tuple7(_Array_append10(name, params0), _Array_append10(listTail(n), args0))).otherwise(() => _tuple7(params0, args0))))(listArmBinds(ctx, elems, 0)))(_Str_join5(" && ", _Array_prepend7(head, guards))))(_Option_isSome3(rest) ? `_pull(${show6(n)})` : `!_pull(${show6(n + 1)}) && _b.length === ${show6(n)}`))(listArmGuards(ctx, elems, 0)))(length10(elems))).otherwise(() => ""));
var listMatchLoop = _curry13(3, (ctx, arms, i) => match12(_Array_get10(i, arms)).with({ _tag: "None" }, () => _tuple7([], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()')).with({ _tag: "Some" }, ({ value: a }) => and9(isPList2(a.pattern), not8(isCatchAll2(a.pattern))) ? (([restLines, fallback]) => _tuple7(_Array_prepend7(genListArm(ctx, a.pattern, a.body), restLines), fallback))(listMatchLoop(ctx, arms, i + 1)) : isCatchAll2(a.pattern) ? ((restName) => ((fallback) => _tuple7([], fallback))(match12(restName).with({ _tag: "Some" }, ({ value: name }) => `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`).with({ _tag: "None" }, () => genExpr(ctx, a.body)).exhaustive()))(match12(a.pattern).with((_v) => {
  const _g = _v;
  return _g._tag === "PList" && _g.rest._tag === "Some" && _g.rest.value._tag === "PBind";
}, ({ rest: { value: { name } } }) => Some12(name)).otherwise(() => None12)) : listMatchLoop(ctx, arms, i + 1)).exhaustive());
var genListMatch = _curry13(3, (ctx, scrutinee, arms) => (([armLines, fallback]) => concat(concat(concat(concat(concat(concat(concat(concat("((_it) => { const _b = []; let _done = false; ", "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "), `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };
`), _Str_join5(`
`, armLines)), `
  return `), fallback), `;
})(`), genExpr(ctx, scrutinee)), "[Symbol.iterator]())"))(listMatchLoop(ctx, arms, 0)));
var matchArmsLoop = _curry13(4, (ctx, arms, i, base) => match12(_Array_get10(i, arms)).with({ _tag: "None" }, () => _tuple7([], None12)).with({ _tag: "Some" }, ({ value: a }) => (([restLines, restCatch]) => match12(a.guard).with({ _tag: "Some" }, ({ value: g }) => _tuple7(_Array_prepend7(`  ${genGuardArm(ctx, a.pattern, a.body, Some12(g), base)}`, restLines), restCatch)).with({ _tag: "None" }, () => isCatchAll2(a.pattern) ? _tuple7(restLines, Some12(_tuple7(a.pattern, a.body))) : _tuple7(_Array_prepend7(`  ${genWithArm(ctx, a.pattern, a.body, base)}`, restLines), restCatch)).exhaustive())(matchArmsLoop(ctx, arms, i + 1, base))).exhaustive());
var hasArrArm = (arms) => someOf3((a) => match12(a.pattern).with({ _tag: "PArr" }, () => true).otherwise(() => false), arms);
var genMatch = _curry13(3, (ctx, scrutinee, arms) => isListMatch(arms) ? genListMatch(ctx, scrutinee, arms) : ((base) => (([armLines, catchAll]) => {
  const tail = match12(catchAll).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [p, body] }) => `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`).with({ _tag: "None" }, () => and9(_Option_isSome3(ctx.guardBaseType), hasArrArm(arms)) ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })' : "  .exhaustive()").exhaustive();
  return _Str_join5(`
`, _Array_concat5(_Array_prepend7(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail]));
})(matchArmsLoop(ctx, arms, 0, base)))(hook1(ctx.guardBaseType, scrutinee)));
var litValue = (p) => match12(p).with({ _tag: "PStr" }, ({ value: v }) => jsStringLit(v)).with({ _tag: "PLit" }, ({ raw }) => raw).with({ _tag: "PBool" }, ({ value: v }) => v ? "true" : "false").otherwise(() => "");
var fieldRefine = _curry13(3, (ctx, p, fieldBase) => match12(p).with({ _tag: "PCtor" }, () => Some12(patTarget(ctx, p, fieldBase))).with({ _tag: "PRecord" }, () => ((t) => eq12(t, fieldBase) ? None12 : Some12(t))(patTarget(ctx, p, fieldBase))).otherwise(() => None12));
var ctorRefines = _curry13(5, (ctx, args, keys, member, i) => match12(_Array_get10(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => ((rest) => ((key) => match12(fieldRefine(ctx, a, `${member}[${jsStringLit(key)}]`)).with({ _tag: "Some" }, ({ value: sub4 }) => _Array_prepend7(`${jsStringLit(key)}: ${sub4}`, rest)).with({ _tag: "None" }, () => rest).exhaustive())(_Option_unwrapOr7(`_${show6(i)}`, _Array_get10(i, keys))))(ctorRefines(ctx, args, keys, member, i + 1))).exhaustive());
var recordRefines = _curry13(4, (ctx, fields, base, i) => match12(_Array_get10(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((rest) => match12(fieldRefine(ctx, f.pat, `${base}[${jsStringLit(f.label)}]`)).with({ _tag: "Some" }, ({ value: sub4 }) => _Array_prepend7(`${jsStringLit(f.label)}: ${sub4}`, rest)).with({ _tag: "None" }, () => rest).exhaustive())(recordRefines(ctx, fields, base, i + 1))).exhaustive());
var tupleSlotBase = _curry13(2, (base, i) => `(${base})[${show6(i)}]`);
var tupleTargets = _curry13(4, (ctx, elems, base, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => ((slotBase) => _Array_prepend7(_Option_unwrapOr7(slotBase, fieldRefine(ctx, el, slotBase)), tupleTargets(ctx, elems, base, i + 1)))(tupleSlotBase(base, i))).exhaustive());
var tupleRefines = _curry13(4, (ctx, elems, base, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: el }) => or7(_Option_isSome3(fieldRefine(ctx, el, tupleSlotBase(base, i))), tupleRefines(ctx, elems, base, i + 1))).exhaustive());
var arrTargets = _curry13(4, (ctx, elems, elemBase, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_prepend7(_Option_unwrapOr7(elemBase, fieldRefine(ctx, el, elemBase)), arrTargets(ctx, elems, elemBase, i + 1))).exhaustive());
var arrRefines = _curry13(4, (ctx, elems, elemBase, i) => match12(_Array_get10(i, elems)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: el }) => or7(_Option_isSome3(fieldRefine(ctx, el, elemBase)), arrRefines(ctx, elems, elemBase, i + 1))).exhaustive());
var patTarget = _curry13(3, (ctx, p, base) => match12(p).with({ _tag: "PAs" }, ({ pat }) => patTarget(ctx, pat, base)).with({ _tag: "PCtor" }, ({ ctor, args }) => ((member) => ((keys) => ((refines) => eq12(length10(refines), 0) ? member : `${member} & { ${_Str_join5("; ", refines)} }`)(ctorRefines(ctx, args, keys, member, 0)))(_Option_unwrapOr7([], _Map_get7(ctor, ctx.keys))))(`Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`)).with({ _tag: "PRecord" }, ({ fields }) => ((refines) => eq12(length10(refines), 0) ? base : `${base} & { ${_Str_join5("; ", refines)} }`)(recordRefines(ctx, fields, base, 0))).with({ _tag: "PTuple" }, ({ elems }) => not8(tupleRefines(ctx, elems, base, 0)) ? base : `[${_Str_join5(", ", tupleTargets(ctx, elems, base, 0))}]`).with({ _tag: "PArr" }, ({ elems, rest: restOpt }) => ((elemBase) => not8(arrRefines(ctx, elems, elemBase, 0)) ? base : ((heads) => match12(restOpt).with({ _tag: "Some" }, () => `[${heads}, ...${base}]`).with({ _tag: "None" }, () => `[${heads}]`).exhaustive())(_Str_join5(", ", arrTargets(ctx, elems, elemBase, 0))))(`(${base})[number]`)).otherwise(() => base));
var genGuardArm = _curry13(5, (ctx, p, body, guardOpt, base) => {
  const root = _Option_isSome3(base) ? "_g" : "_v";
  const conds0 = patConds(ctx, p, root);
  const slot = match12(p).with({ _tag: "PAs" }, ({ pat }) => patSlot(ctx, pat)).otherwise(() => patSlot(ctx, p));
  const conds = match12(guardOpt).with({ _tag: "Some" }, ({ value: g }) => match12(p).with({ _tag: "PAs" }, ({ name }) => _Array_append10(eq12(slot, "") ? `((${name}) => ${genExpr(ctx, g)})(${root})` : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(${root})`, conds0)).otherwise(() => _Array_append10(eq12(slot, "") ? `(${genExpr(ctx, g)})` : `((${slot}) => ${genExpr(ctx, g)})(${root})`, conds0))).with({ _tag: "None" }, () => conds0).exhaustive();
  const test = eq12(length10(conds), 0) ? "true" : _Str_join5(" && ", conds);
  const handler = match12(p).with({ _tag: "PAs" }, ({ name }) => `(${name}) => ${eq12(slot, "") ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`}`).otherwise(() => `${eq12(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)}`);
  return match12(base).with({ _tag: "None" }, () => `.with((_v) => ${test}, ${handler})`).with({ _tag: "Some" }, ({ value: b }) => ((target) => eq12(target, b) ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})` : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`)(patTarget(ctx, p, b))).exhaustive();
});
var isFlatSub = (p) => match12(p).with({ _tag: "PAs" }, () => false).with({ _tag: "PBind" }, () => true).with({ _tag: "PWild" }, () => true).with({ _tag: "PLit" }, () => true).with({ _tag: "PBool" }, () => true).with({ _tag: "PStr" }, () => true).otherwise(() => false);
var recordLits = _curry13(2, (fields, i) => match12(_Array_get10(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((rest) => match12(f.pat).with({ _tag: "PLit" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).with({ _tag: "PBool" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).with({ _tag: "PStr" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).otherwise(() => rest))(recordLits(fields, i + 1))).exhaustive());
var ctorArgParts = _curry13(4, (ctx, ctor, args, i) => match12(_Array_get10(i, args)).with({ _tag: "None" }, () => _tuple7([], [])).with({ _tag: "Some" }, ({ value: a }) => (([restBinds, restLits]) => {
  const key = keyAt(ctx, ctor, i);
  return match12(a).with({ _tag: "PBind" }, ({ name }) => _tuple7(_Array_prepend7(keyedSlot(key, name), restBinds), restLits)).with({ _tag: "PLit" }, () => _tuple7(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).with({ _tag: "PBool" }, () => _tuple7(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).with({ _tag: "PStr" }, () => _tuple7(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).otherwise(() => _tuple7(restBinds, restLits));
})(ctorArgParts(ctx, ctor, args, i + 1))).exhaustive());
var genWithArm = _curry13(4, (ctx, p, body, base) => match12(p).with({ _tag: "PAs" }, () => genGuardArm(ctx, p, body, None12, base)).with({ _tag: "PArr" }, () => genGuardArm(ctx, p, body, None12, base)).with({ _tag: "PTuple" }, () => genGuardArm(ctx, p, body, None12, base)).with({ _tag: "POr" }, () => genGuardArm(ctx, p, body, None12, base)).with({ _tag: "PLit" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PBool" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PStr" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PRecord" }, ({ fields }) => allOf2((f) => isFlatSub(f.pat), fields) ? ((lits) => ((slot) => `.with({ ${_Str_join5(", ", lits)} }, ${eq12(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)})`)(patSlot(ctx, p)))(recordLits(fields, 0)) : genGuardArm(ctx, p, body, None12, base)).with({ _tag: "PCtor" }, ({ ctor, args }) => allOf2(isFlatSub, args) ? (([binds, litFields]) => {
  const patObj = _Str_join5(", ", _Array_prepend7(`_tag: ${jsStringLit(ctor)}`, litFields));
  const param = eq12(length10(binds), 0) ? "()" : `({ ${_Str_join5(", ", binds)} })`;
  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`;
})(ctorArgParts(ctx, ctor, args, 0)) : genGuardArm(ctx, p, body, None12, base)).otherwise(() => genGuardArm(ctx, p, body, None12, base)));
var typedCtorParams = _curry13(3, (keys, paramTypes, i) => match12(_Array_get10(i, keys)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: k }) => _Array_prepend7(`${k}: ${_Option_unwrapOr7("unknown", _Array_get10(i, paramTypes))}`, typedCtorParams(keys, paramTypes, i + 1))).exhaustive());
var genCtor = _curry13(2, (c, ts) => {
  const tag = jsStringLit(c.name);
  return eq12(length10(c.fields), 0) ? match12(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`).with({ _tag: "None" }, () => `const ${c.name} = { _tag: ${tag} };`).exhaustive() : ((keys) => ((params) => ((impl) => length10(c.fields) >= 2 ? ((curried) => match12(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name} = ${curried} as ${t.generics}(${_Str_join5(", ", typedCtorParams(keys, t.paramTypes, 0))}) => ${t.ret};`).with({ _tag: "None" }, () => `const ${c.name} = ${curried};`).exhaustive())(`_curry(${show6(length10(c.fields))}, ${impl})`) : match12(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name} = ${t.generics}(${_Str_join5(", ", typedCtorParams(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`).with({ _tag: "None" }, () => `const ${c.name} = ${impl};`).exhaustive())(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join5(", ", keys)))(keysOf(c.fields));
});
var genCtorsFrom = _curry13(6, (s, ctors, h, refs, exported, i) => match12(_Array_get10(i, ctors)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: c }) => ((rest) => or7(exported, _Set_has5(c.name, refs)) ? _Array_prepend7(genCtor(c, hook2(h, s, c)), rest) : rest)(genCtorsFrom(s, ctors, h, refs, exported, i + 1))).exhaustive());
var genType = _curry13(2, (ctx, s) => match12(s).with({ _tag: "SType" }, ({ ctors, exported }) => _Str_join5(`
`, genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0))).otherwise(() => ""));
var typeExprArity = (te) => match12(te).with({ _tag: "TyArrow" }, ({ to }) => 1 + typeExprArity(to)).otherwise(() => 0);
var externArgs = (n) => {
  let i = 0;
  let acc = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      [i, acc] = [i + 1, eq12(acc, "") ? `$a${show6(i)}` : `${acc}, $a${show6(i)}`];
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
var genExtern = (s) => match12(s).with({ _tag: "SExtern" }, ({ name, typeExpr, module: modName, imported, curried }) => _Str_startsWith3("mochi:global:", modName) ? ((target) => ((base) => `const ${name} = ${eq12(imported, "") ? base : `${base}[${jsStringLit(imported)}]`};`)(`globalThis[${jsStringLit(target)}]`))(_Str_slice3(13, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:get:", modName) ? ((target) => `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:set:", modName) ? ((target) => `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:new:", modName) ? ((target) => ((arity) => ((args) => not8(eq12(imported, "")) ? ((raw) => ((importLine) => ((ctor) => eq12(arity, 0) ? `${importLine}
const ${name} = () => ${ctor};` : `${importLine}
const ${name} = _curry(${show6(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(`import { ${imported} as ${raw} } from ${jsStringLit(target)};`))(_Str_concat2("$", name)) : eq12(arity, 0) ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();` : `const ${name} = _curry(${show6(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(externArgs(arity)))(typeExprArity(typeExpr)))(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:send:", modName) ? ((target) => ((arity) => ((args) => ((fn) => arity < 2 ? `const ${name} = ${fn};` : `const ${name} = _curry(${show6(arity)}, ${fn});`)(eq12(args, "") ? `($receiver) => $receiver[${jsStringLit(target)}]()` : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`))(externArgs(arity - 1)))(typeExprArity(typeExpr)))(_Str_slice3(11, _Str_length3(modName), modName)) : eq12(imported, "default") ? `import ${name} from ${jsStringLit(modName)};` : ((arity) => arity <= 1 ? ((spec) => `import { ${spec} } from ${jsStringLit(modName)};`)(eq12(imported, name) ? name : `${imported} as ${name}`) : ((raw) => ((flat) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show6(arity)}, ${flat});`)(curried ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}` : raw))(_Str_concat2("$", name)))(typeExprArity(typeExpr))).otherwise(() => "");
var stripAlExt = (s) => _Str_endsWith2(".mochi", s) ? _Str_slice3(0, _Str_length3(s) - 6, s) : s;
var rewriteImportPath = _curry13(2, (from, ext) => {
  const bare = stripAlExt(from);
  return or7(_Str_startsWith3("./", bare), _Str_startsWith3("../", bare)) ? `${bare}${ext}` : bare;
});
var genImport = _curry13(2, (s, ext) => match12(s).with({ _tag: "SImport" }, ({ names, from }) => ((nameList) => ((path) => `import { ${nameList} } from ${jsStringLit(path)};`)(rewriteImportPath(from, ext)))(_Str_join5(", ", map9((n) => n.name, names)))).with({ _tag: "SImportNs" }, ({ alias, from }) => ((path) => `import * as ${alias.name} from ${jsStringLit(path)};`)(rewriteImportPath(from, ext))).otherwise(() => ""));
var exportLine = (l) => `export ${l}`;
var jsDocLine = (l) => _Str_length3(l) > 0 ? ` * ${_Str_replace("*/", "*\\/", l)}` : " *";
var jsDoc = (docOpt) => match12(docOpt).with({ _tag: "None" }, () => "").with({ _tag: "Some" }, ({ value: doc }) => ((lines) => `/**
${_Str_join5(`
`, lines)}
 */
`)(map9(jsDocLine, _Str_split2(`
`, doc)))).exhaustive();
var genStmt = _curry13(2, (ctx, s) => match12(s).with({ _tag: "SError" }, ({ span: sp }) => `throw new Error("codegen invariant: error node reached codegen at ${show6(sp.start)}");`).with({ _tag: "SImport" }, () => genImport(s, ctx.moduleExt)).with({ _tag: "SImportNs" }, () => genImport(s, ctx.moduleExt)).with({ _tag: "SType" }, ({ exported }) => ((decls) => eq12(decls, "") ? "" : exported ? _Str_join5(`
`, map9(exportLine, _Str_split2(`
`, decls))) : decls)(genType(ctx, s))).with({ _tag: "SExtern" }, ({ name, exported, doc }) => ((docComment) => exported ? `${docComment}${genExtern(s)}
export { ${name} };` : `${docComment}${genExtern(s)}`)(ctx.docs ? jsDoc(doc) : "")).with({ _tag: "SLet" }, ({ name, value, exported, doc }) => ((doExport) => ((docComment) => `${docComment}${doExport ? "export " : ""}const ${name}${_Option_unwrapOr7("", hook2(ctx.annotateLet, name, value))} = ${genExpr(ctx, value)};`)(and9(ctx.docs, not8(_Str_startsWith3("$", name))) ? jsDoc(doc) : ""))(and9(exported, not8(_Str_startsWith3("$", name))))).with({ _tag: "SExpr" }, ({ value }) => `${genExpr(ctx, value)};`).exhaustive());
var usesMatchLibArm = (a) => or7(match12(a.guard).with({ _tag: "Some" }, ({ value: g }) => usesMatchLib(g)).with({ _tag: "None" }, () => false).exhaustive(), usesMatchLib(a.body));
var usesMatchLib = (e) => match12(e).with({ _tag: "ENum" }, () => false).with({ _tag: "EUnit" }, () => false).with({ _tag: "EBool" }, () => false).with({ _tag: "EStr" }, () => false).with({ _tag: "ERef" }, () => false).with({ _tag: "ECall" }, ({ fn, args }) => or7(usesMatchLib(fn), someOf3(usesMatchLib, args))).with({ _tag: "ELambda" }, ({ body }) => usesMatchLib(body)).with({ _tag: "ELetIn" }, ({ value, body }) => or7(usesMatchLib(value), usesMatchLib(body))).with({ _tag: "ELetBind" }, ({ value, body }) => or7(usesMatchLib(value), usesMatchLib(body))).with({ _tag: "EPipe" }, ({ left, right }) => or7(usesMatchLib(left), usesMatchLib(right))).with({ _tag: "EDo" }, ({ exprs }) => someOf3(usesMatchLib, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or7(usesMatchLib(cond), or7(usesMatchLib(thenE), usesMatchLib(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or7(not8(isListMatch(arms)), or7(usesMatchLib(scrutinee), someOf3(usesMatchLibArm, arms)))).with({ _tag: "ELoop" }, ({ params, body }) => or7(someOf3((p) => usesMatchLib(p.init), params), usesMatchLib(body))).with({ _tag: "ERecur" }, ({ args }) => someOf3(usesMatchLib, args)).with({ _tag: "ERecord" }, ({ fields, spread }) => or7(match12(spread).with({ _tag: "Some" }, ({ value: s }) => usesMatchLib(s)).with({ _tag: "None" }, () => false).exhaustive(), someOf3((f) => usesMatchLib(f.value), fields))).with({ _tag: "EField" }, ({ target }) => usesMatchLib(target)).with({ _tag: "ETuple" }, ({ elements }) => someOf3(usesMatchLib, elements)).with({ _tag: "EArr" }, ({ elements }) => someOf3((el) => usesMatchLib(match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "EList" }, ({ elements }) => someOf3((el) => usesMatchLib(match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "ESet" }, ({ elements }) => someOf3((el) => usesMatchLib(match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "EMap" }, ({ entries }) => someOf3((en) => or7(usesMatchLib(en.key), usesMatchLib(en.value)), entries)).with({ _tag: "EInterp" }, ({ parts }) => someOf3((p) => match12(p).with({ _tag: "IPLit" }, () => false).with({ _tag: "IPExpr" }, ({ expr: ex }) => usesMatchLib(ex)).exhaustive(), parts)).exhaustive();
var loopInitRefsFrom2 = _curry13(4, (ctx, params, i, acc) => match12(_Array_get10(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom2(ctx, params, i + 1, exprRefs(ctx, p.init, acc))).exhaustive());
var exprRefsListFrom = _curry13(4, (ctx, xs, i, acc) => match12(_Array_get10(i, xs)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: x }) => exprRefsListFrom(ctx, xs, i + 1, exprRefs(ctx, x, acc))).exhaustive());
var exprRefsInterpPartsFrom = _curry13(4, (ctx, parts, i, acc) => match12(_Array_get10(i, parts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => exprRefsInterpPartsFrom(ctx, parts, i + 1, match12(p).with({ _tag: "IPLit" }, () => acc).with({ _tag: "IPExpr" }, ({ expr: ex }) => exprRefs(ctx, ex, acc)).exhaustive())).exhaustive());
var exprRefsArmsFrom = _curry13(4, (ctx, arms, i, acc) => match12(_Array_get10(i, arms)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: a }) => ((acc1) => exprRefsArmsFrom(ctx, arms, i + 1, exprRefs(ctx, a.body, acc1)))(match12(a.guard).with({ _tag: "Some" }, ({ value: g }) => exprRefs(ctx, g, acc)).with({ _tag: "None" }, () => acc).exhaustive())).exhaustive());
var exprRefsFieldsFrom = _curry13(4, (ctx, fields, i, acc) => match12(_Array_get10(i, fields)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: f }) => exprRefsFieldsFrom(ctx, fields, i + 1, exprRefs(ctx, f.value, acc))).exhaustive());
var exprRefsEntriesFrom = _curry13(4, (ctx, entries, i, acc) => match12(_Array_get10(i, entries)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: en }) => exprRefsEntriesFrom(ctx, entries, i + 1, exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc)))).exhaustive());
var exprRefs = _curry13(3, (ctx, e, acc) => match12(e).with({ _tag: "ENum" }, () => acc).with({ _tag: "EUnit" }, () => acc).with({ _tag: "EBool" }, () => acc).with({ _tag: "EStr" }, () => acc).with({ _tag: "ERef" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "ECall" }, ({ fn, args }) => exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc))).with({ _tag: "ELambda" }, ({ params, body }) => (([cparams, cbody, fills]) => {
  const acc2 = length10(cparams) >= 2 ? _Set_add5("_curry", acc) : acc;
  const acc3 = reduce3(_curry13(2, (a, g) => reduce3(_curry13(2, (b, lab) => match12(lab).with((_v) => {
    const _g = _v;
    return _g._tag === "LPSpanned" && _g.param._tag === "LPLabeled" && _g.param.defaultValue._tag === "Some";
  }, ({ param: { defaultValue: { value: d } } }) => exprRefs(ctx, d, b)).with((_v) => {
    const _g = _v;
    return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
  }, ({ defaultValue: { value: d } }) => exprRefs(ctx, d, b)).otherwise(() => b)), a, g.labs)), acc2, fills);
  return exprRefs(ctx, cbody, acc3);
})(collapseLambda(params, body))).with({ _tag: "ELetIn" }, ({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc))).with({ _tag: "ELetBind" }, ({ monad, value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, _Set_add5(bindRuntime(monad), acc)))).with({ _tag: "EPipe" }, ({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc))).with({ _tag: "EDo" }, ({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => exprRefs(ctx, elseE, exprRefs(ctx, thenE, exprRefs(ctx, cond, acc)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => ((acc1) => ((acc2) => exprRefsArmsFrom(ctx, arms, 0, acc2))(someOf3((a) => match12(a.pattern).with((_v) => {
  const _g = _v;
  return _g._tag === "PList" && _g.rest._tag === "Some" && _g.rest.value._tag === "PBind";
}, () => true).otherwise(() => false), arms) ? _Set_add5("_list", acc1) : acc1))(exprRefs(ctx, scrutinee, acc))).with({ _tag: "ERecord" }, ({ fields, spread }) => exprRefsFieldsFrom(ctx, fields, 0, match12(spread).with({ _tag: "Some" }, ({ value: s }) => exprRefs(ctx, s, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "EField" }, ({ target, name }) => match12(emptyNsEmit(target, name, None12)).with({ _tag: "Some" }, () => match12(target).with({ _tag: "ERef", name: "List" }, () => _Set_add5("_list", acc)).otherwise(() => acc)).with({ _tag: "None" }, () => match12(nsRuntimeId(ctx, target, name)).with({ _tag: "Some" }, ({ value: rt }) => _Set_add5(rt, acc)).with({ _tag: "None" }, () => exprRefs(ctx, target, acc)).exhaustive()).exhaustive()).with({ _tag: "ELoop" }, ({ params, body }) => ((acc1) => ((acc2) => exprRefs(ctx, body, acc2))(loopInitRefsFrom2(ctx, params, 0, acc1)))(loopNeedsStep(body) ? _Set_add5("_recur", _Set_add5("_done", acc)) : acc)).with({ _tag: "ERecur" }, ({ args }) => exprRefsListFrom(ctx, args, 0, acc)).with({ _tag: "ETuple" }, ({ elements }) => exprRefsListFrom(ctx, elements, 0, acc)).with({ _tag: "EArr" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, acc)).with({ _tag: "EList" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, _Set_add5("_list", acc))).with({ _tag: "ESet" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match12(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, acc)).with({ _tag: "EMap" }, ({ entries }) => exprRefsEntriesFrom(ctx, entries, 0, acc)).with({ _tag: "EInterp" }, ({ parts }) => exprRefsInterpPartsFrom(ctx, parts, 0, acc)).exhaustive());
var boundNamesFrom = _curry13(3, (stmts, i, acc) => match12(_Array_get10(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => boundNamesFrom(stmts, i + 1, match12(s).with({ _tag: "SLet" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "SExtern" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "SType" }, ({ ctors }) => _Set_union(acc, _Set_fromArray5(map9((c) => c.name, ctors)))).with({ _tag: "SImport" }, ({ names }) => _Set_union(acc, _Set_fromArray5(map9((n) => n.name, names)))).with({ _tag: "SImportNs" }, ({ alias }) => _Set_add5(alias.name, acc)).with({ _tag: "SError" }, () => acc).with({ _tag: "SExpr" }, () => acc).exhaustive())).exhaustive());
var boundNames = (stmts) => boundNamesFrom(stmts, 0, _Set_fromArray5([]));
var collectValueRefs = _curry13(4, (ctx, stmts, i, acc) => match12(_Array_get10(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => collectValueRefs(ctx, stmts, i + 1, match12(s).with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, acc)).with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, acc)).otherwise(() => acc))).exhaustive());
var refsForStmt = _curry13(2, (ctx, s) => match12(s).with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray5([]))).with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray5([]))).with({ _tag: "SType" }, ({ ctors, exported }) => someOf3((c) => and9(length10(c.fields) >= 2, or7(exported, _Set_has5(c.name, ctx.valueRefs))), ctors) ? _Set_add5("_curry", _Set_fromArray5([])) : _Set_fromArray5([])).with({ _tag: "SExtern" }, ({ typeExpr }) => typeExprArity(typeExpr) >= 2 ? _Set_add5("_curry", _Set_fromArray5([])) : _Set_fromArray5([])).otherwise(() => _Set_fromArray5([])));
var collectRefsFrom = _curry13(4, (ctx, stmts, i, acc) => match12(_Array_get10(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => collectRefsFrom(ctx, stmts, i + 1, _Set_union(acc, refsForStmt(ctx, s)))).exhaustive());
var addDepsFrom = _curry13(4, (deps, j, refs, queue) => match12(_Array_get10(j, deps)).with({ _tag: "None" }, () => _tuple7(refs, queue)).with({ _tag: "Some" }, ({ value: d }) => _Set_has5(d, refs) ? addDepsFrom(deps, j + 1, refs, queue) : addDepsFrom(deps, j + 1, _Set_add5(d, refs), _Array_append10(d, queue))).exhaustive());
var closeRefsFrom = _curry13(4, (queue, i, refs, runtimeDeps) => match12(_Array_get10(i, queue)).with({ _tag: "None" }, () => refs).with({ _tag: "Some" }, ({ value: r }) => ((deps) => (([refs2, queue2]) => closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue)))(_Option_unwrapOr7([], _Map_get7(r, runtimeDeps)))).exhaustive());
var runtimeRefNames = _curry13(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const refs0 = collectRefsFrom(ctx, stmts, 0, _Set_fromArray5([]));
  const refs = closeRefsFrom(_Set_toArray3(refs0), 0, refs0, runtimeDeps);
  const bound = boundNames(stmts);
  return filter4((n) => and9(_Set_has5(n, refs), not8(_Set_has5(n, bound))), _Map_keys5(jsDefs));
});
var preludePreamble = _curry13(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const names = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
  const defs = map9((n) => _Map_getOr6("", n, jsDefs), names);
  return eq12(length10(defs), 0) ? "" : `${_Str_join5(`
`, defs)}

`;
});
var genStmtAllFrom = _curry13(3, (ctx, stmts, i) => match12(_Array_get10(i, stmts)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: s }) => _Array_prepend7(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, i + 1))).exhaustive());
var codegenWith = _curry13(7, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, opts) => {
  const keys0 = ctorKeysFromStmts(stmts, imported);
  const keys = seedBuiltinCtorKeys(stmts, keys0);
  const ctx0 = { keys, ns, annotateLet: opts.annotateLet, annotateCtor: opts.annotateCtor, annotateParams: opts.annotateParams, annotateEmpty: opts.annotateEmpty, annotateLetin: opts.annotateLetin, annotateCall: opts.annotateCall, guardBaseType: opts.guardBaseType, flattenPipe: opts.flattenPipe, tupleHelper: opts.tupleHelper, preserveInfix: opts.preserveInfix, preserveJsx: opts.preserveJsx, moduleExt: opts.moduleExt, valueRefs: _Set_fromArray5([]), docs: opts.docs };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray5([]));
  const ctx = { ...ctx0, valueRefs };
  const needsMatch = someOf3((s) => match12(s).with({ _tag: "SLet" }, ({ value }) => usesMatchLib(value)).with({ _tag: "SExpr" }, ({ value }) => usesMatchLib(value)).otherwise(() => false), stmts);
  const header = needsMatch ? `import { match } from "@onrails/pattern";

` : "";
  const preamble = useRuntime ? preludePreamble(ctx, stmts, jsDefs, runtimeDeps) : "";
  const body = _Str_join5(`
`, genStmtAllFrom(ctx, stmts, 0));
  return `${header}${preamble}${body}
`;
});
var runtimeDepNames = _curry13(5, (stmts, imported, ns, jsDefs, runtimeDeps) => {
  const keys = seedBuiltinCtorKeys(stmts, ctorKeysFromStmts(stmts, imported));
  const ctx0 = { keys, ns, annotateLet: None12, annotateCtor: None12, annotateParams: None12, annotateEmpty: None12, annotateLetin: None12, annotateCall: None12, guardBaseType: None12, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", valueRefs: _Set_fromArray5([]), docs: false };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray5([]));
  return runtimeRefNames({ ...ctx0, valueRefs }, stmts, jsDefs, runtimeDeps);
});
var codegen = _curry13(6, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts));

import { None as None14, Some as Some14, _Array_append as _Array_append12, _Array_concat as _Array_concat7, _Array_contains as _Array_contains4, _Array_dedupeBy, _Array_drop as _Array_drop3, _Array_get as _Array_get12, _Array_prepend as _Array_prepend9, _Array_reverse as _Array_reverse2, _Array_sort as _Array_sort2, _Array_sortBy, _Array_take as _Array_take3, _Map_delete as _Map_delete2, _Map_get as _Map_get9, _Map_keys as _Map_keys6, _Map_set as _Map_set8, _Map_size as _Map_size2, _Map_values as _Map_values2, _Option_flatMap as _Option_flatMap3, _Option_isSome as _Option_isSome4, _Option_map as _Option_map3, _Option_unwrapOr as _Option_unwrapOr9, _Set_add as _Set_add6, _Set_fromArray as _Set_fromArray6, _Set_has as _Set_has6, _Str_contains, _Str_fromCode as _Str_fromCode3, _Str_join as _Str_join7, _Str_split as _Str_split3, _Str_startsWith as _Str_startsWith4, _curry as _curry15, _tuple as _tuple9, and as and10, concat as concat2, eq as eq14, filter as filter5, length as length12, map as map11, not as not10, or as or8, reduce as reduce4, show as show8 } from "@mochi/compiler/runtime";
import { match as match14 } from "@onrails/pattern";

import { None as None13, Some as Some13, _Array_append as _Array_append11, _Array_concat as _Array_concat6, _Array_get as _Array_get11, _Array_prepend as _Array_prepend8, _Array_sort, _Map_get as _Map_get8, _Map_set as _Map_set7, _Map_size, _Option_flatMap as _Option_flatMap2, _Option_map as _Option_map2, _Option_unwrapOr as _Option_unwrapOr8, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get2, _Str_join as _Str_join6, _curry as _curry14, _tuple as _tuple8, eq as eq13, length as length11, map as map10, not as not9, show as show7 } from "@mochi/compiler/runtime";
import { match as match13 } from "@onrails/pattern";
var tsEnv = _curry14(2, (vars, recs) => ({ vars, recs }));
var noVars = new Map;
var noRecs = new Map;
var plainEnv = (vars) => tsEnv(vars, noRecs);
var recsEnv = (recs) => tsEnv(noVars, recs);
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var letterAt = (i) => _Option_unwrapOr8(`T${show7(i)}`, _Str_get2(i, letters));
var genericNames = (sc) => genericNamesFrom(_Array_concat6(sc.vars, sc.rvars), 0, new Map);
var genericNamesFrom = _curry14(3, (ids, i, names) => match13(_Array_get11(i, ids)).with({ _tag: "None" }, () => names).with({ _tag: "Some" }, ({ value: id }) => genericNamesFrom(ids, i + 1, _Map_set7(id, letterAt(i), names))).exhaustive());
var primitiveTs = (name) => match13(name).with("number", () => "number").with("int", () => "number").with("float", () => "number").with("string", () => "string").with("bool", () => "boolean").with("unit", () => "undefined").otherwise(() => name);
var namesOf = _curry14(2, (ts, env) => _Str_join6(", ", map10((t) => tsOfRaw(t, env), ts)));
var nominal = _curry14(3, (name, args, env) => eq13(length11(args), 0) ? primitiveTs(name) : `${name}<${namesOf(args, env)}>`);
var tsRowFields = _curry14(2, (row, env) => match13(row).with({ _tag: "RowEmpty" }, () => _tuple8([], None13)).with({ _tag: "RowVar" }, ({ id }) => _tuple8([], Some13(id))).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => (([fields, tail]) => _tuple8(_Array_prepend8(`${label}${optional ? "?" : ""}: ${tsOfRaw(fieldType, env)}`, fields), tail))(tsRowFields(rest, env))).exhaustive());
var shapeFieldsFrom = _curry14(2, (row, vars) => match13(row).with({ _tag: "RowEmpty" }, () => Some13([])).with({ _tag: "RowVar" }, () => None13).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => _Option_map2((fs) => _Array_prepend8(`${label}${optional ? "?" : ""}: ${tsOf(fieldType, plainEnv(vars))}`, fs), shapeFieldsFrom(rest, vars))).exhaustive());
var rowShapeKey = _curry14(2, (row, vars) => _Option_map2((fs) => _Str_join6("; ", _Array_sort(fs)), shapeFieldsFrom(row, vars)));
var aliasNameFor = _curry14(2, (row, env) => eq13(_Map_size(env.recs), 0) ? None13 : _Option_flatMap2((k) => _Map_get8(k, env.recs), rowShapeKey(row, env.vars)));
var tsRow = _curry14(2, (row, env) => match13(aliasNameFor(row, env)).with({ _tag: "Some" }, ({ value: alias }) => alias).with({ _tag: "None" }, () => (([fields, tail]) => {
  const body = eq13(length11(fields), 0) ? "{}" : `{ ${_Str_join6("; ", fields)} }`;
  return match13(tail).with({ _tag: "None" }, () => body).with({ _tag: "Some" }, ({ value: id }) => match13(_Map_get8(id, env.vars)).with({ _tag: "None" }, () => body).with({ _tag: "Some" }, ({ value: name }) => eq13(length11(fields), 0) ? name : `(${body} & ${name})`).exhaustive()).exhaustive();
})(tsRowFields(row, env))).exhaustive());
var tsArrow = _curry14(3, (fromT, toT, env) => isUnit(fromT) ? `() => ${tsOfRaw(toT, env)}` : tsArrowParams(fromT, toT, env, 0, []));
var tsArrowParams = _curry14(5, (fromT, toT, env, i, params) => {
  const params1 = _Array_append11(`${_Str_fromCode2(97 + i)}: ${tsOfRaw(fromT, env)}`, params);
  return match13(toT).with((_v) => {
    const _g = _v;
    return _g._tag === "TyFn" && (({ from: nextFrom, to: nextTo }) => not9(isUnit(nextFrom)))(_g);
  }, ({ from: nextFrom, to: nextTo }) => tsArrowParams(nextFrom, nextTo, env, i + 1, params1)).otherwise(() => `(${_Str_join6(", ", params1)}) => ${tsOfRaw(toT, env)}`);
});
var tsOf = _curry14(2, (t, env) => tsOfRaw(widenLits(t), env));
var tsOfRaw = _curry14(2, (t, env) => match13(t).with({ _tag: "TyVar" }, ({ id }) => _Option_unwrapOr8("unknown", _Map_get8(id, env.vars))).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Array" && _g.args.length === 1;
}, ({ args: [elem] }) => ((inner) => match13(elem).with({ _tag: "TyFn" }, () => `(${inner})[]`).with({ _tag: "TyOneOf" }, () => `(${inner})[]`).otherwise(() => `${inner}[]`))(tsOfRaw(elem, env))).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "List" && _g.args.length === 1;
}, ({ args: [elem] }) => `Iterable<${tsOfRaw(elem, env)}>`).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
}, ({ args: [value, error] }) => `() => Promise<Result<${tsOfRaw(value, env)}, ${tsOfRaw(error, env)}>>`).with({ _tag: "TyCon", name: "tuple" }, ({ args: elems }) => `[${namesOf(elems, env)}]`).with({ _tag: "TyCon" }, ({ name, args }) => nominal(name, args, env)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tsArrow(fromT, toT, env)).with({ _tag: "TyRecord" }, ({ row }) => tsRow(row, env)).with({ _tag: "TySingleton", base: "string" }, ({ value }) => `"${value}"`).with({ _tag: "TySingleton" }, ({ value }) => value).with({ _tag: "TyOneOf" }, ({ members }) => _Str_join6(" | ", map10((m) => tsOfRaw(m, env), members))).exhaustive());

var paramVarsFrom = _curry15(2, (params, i) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => new Map).with({ _tag: "Some" }, ({ value: p }) => _Map_set8(p, tVar(i), paramVarsFrom(params, i + 1))).exhaustive());
var paramNamesFrom = _curry15(2, (params, i) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => new Map).with({ _tag: "Some" }, () => _Map_set8(i, letterAt(i), paramNamesFrom(params, i + 1))).exhaustive());
var genericHead = _curry15(3, (params, i, acc) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => eq14(length12(acc), 0) ? "" : `<${_Str_join7(", ", acc)}>`).with({ _tag: "Some" }, () => genericHead(params, i + 1, _Array_append12(letterAt(i), acc))).exhaustive());
var fieldTs = _curry15(4, (te, params, aliases, recs) => {
  const vars = paramVarsFrom(params, 0);
  const names = paramNamesFrom(params, 0);
  return (([t, _vars, _st]) => tsOf(t, tsEnv(names, recs)))(typeExprToType(te, vars, mkSt(length12(params)), aliases, _Set_fromArray6([])));
});
var ctorFieldsFrom = _curry15(6, (fields, keys, params, aliases, recs, i) => match14(_Array_get12(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: fld }) => _Array_prepend9(`${_Option_unwrapOr9(`_${show8(i)}`, _Array_get12(i, keys))}: ${fieldTs(fld.fieldType, params, aliases, recs)}`, ctorFieldsFrom(fields, keys, params, aliases, recs, i + 1))).exhaustive());
var ctorVariant = _curry15(4, (c, params, aliases, recs) => {
  const fields = ctorFieldsFrom(c.fields, keysOf(c.fields), params, aliases, recs, 0);
  return eq14(length12(fields), 0) ? `{ _tag: "${c.name}" }` : `{ _tag: "${c.name}"; ${_Str_join7("; ", fields)} }`;
});
var ctorVariantsFrom = _curry15(5, (ctors, params, aliases, recs, i) => match14(_Array_get12(i, ctors)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: c }) => _Array_prepend9(`  | ${ctorVariant(c, params, aliases, recs)}`, ctorVariantsFrom(ctors, params, aliases, recs, i + 1))).exhaustive());
var typeDecl = _curry15(5, (name, params, ctors, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} =
${_Str_join7(`
`, ctorVariantsFrom(ctors, params, aliases, recs, 0))};`;
});
var aliasFieldsFrom2 = _curry15(5, (fields, params, aliases, recs, i) => match14(_Array_get12(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_prepend9(`${f.name}${f.optional ? "?" : ""}: ${fieldTs(f.fieldType, params, aliases, recs)}`, aliasFieldsFrom2(fields, params, aliases, recs, i + 1))).exhaustive());
var recordAliasDecl = _curry15(5, (name, params, fields, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  const body = aliasFieldsFrom2(fields, params, aliases, recs, 0);
  return eq14(length12(body), 0) ? `export type ${head} = {};` : `export type ${head} = { ${_Str_join7("; ", body)} };`;
});
var aliasTsDecl = _curry15(5, (name, params, template, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} = ${fieldTs(template, params, aliases, recs)};`;
});
var opaqueTypeDecl = (name) => `declare const ${name}: unique symbol;
export type ${name} = { readonly [${name}]: never };`;
var mergeInto = _curry15(4, (keys, src, acc, i) => match14(_Array_get12(i, keys)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: k }) => mergeInto(keys, src, match14(_Map_get9(k, src)).with({ _tag: "Some" }, ({ value: v }) => _Map_set8(k, v, acc)).with({ _tag: "None" }, () => acc).exhaustive(), i + 1)).exhaustive());
var unionNamesFrom = _curry15(3, (schemes, i, acc) => match14(_Array_get12(i, schemes)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: sc }) => ((names) => unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys6(names), names, acc, 0)))(genericNames(sc))).exhaustive());
var unionGenericNames = (schemes) => unionNamesFrom(schemes, 0, new Map);
var allVarsIn = _curry15(2, (t, names) => match14(t).with({ _tag: "TyVar" }, ({ id }) => _Option_isSome4(_Map_get9(id, names))).with({ _tag: "TyCon" }, ({ args }) => allVarsInAll(args, names, 0)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => and10(allVarsIn(fromT, names), allVarsIn(toT, names))).with({ _tag: "TyRecord" }, ({ row }) => allVarsInRow(row, names)).with({ _tag: "TySingleton" }, () => true).with({ _tag: "TyOneOf" }, ({ members }) => allVarsInAll(members, names, 0)).exhaustive());
var allVarsInAll = _curry15(3, (ts, names, i) => match14(_Array_get12(i, ts)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: t }) => and10(allVarsIn(t, names), allVarsInAll(ts, names, i + 1))).exhaustive());
var allVarsInRow = _curry15(2, (row, names) => match14(row).with({ _tag: "RowEmpty" }, () => true).with({ _tag: "RowVar" }, ({ id }) => _Option_isSome4(_Map_get9(id, names))).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => and10(allVarsIn(fieldType, names), allVarsInRow(rest, names))).exhaustive());
var isConcrete2 = (t) => allVarsIn(t, new Map([]));
var emptyCollTs = _curry15(2, (t, env) => allVarsIn(t, env.vars) ? Some14(tsOf(t, env)) : None14);
var ctorCallTs = _curry15(2, (t, recs) => match14(t).with({ _tag: "TyCon" }, ({ args }) => or8(eq14(length12(args), 0), not10(isConcrete2(t))) ? None14 : Some14(tsOf(t, recsEnv(recs)))).otherwise(() => None14));
var guardParamTs = _curry15(2, (t, recs) => isConcrete2(t) ? Some14(tsOf(t, recsEnv(recs))) : None14);
var lambdaParamsFrom = _curry15(4, (t, arity, env, i) => i >= arity ? [] : match14(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(allVarsIn(fromT, env.vars) ? Some14(tsOf(fromT, env)) : isConcrete2(fromT) ? Some14(tsOf(fromT, recsEnv(env.recs))) : None14, lambdaParamsFrom(toT, arity, env, i + 1))).otherwise(() => _Array_prepend9(None14, lambdaParamsFrom(t, arity, env, i + 1))));
var lambdaParamTypesTs = _curry15(3, (lamType, arity, env) => lambdaParamsFrom(lamType, arity, env, 0));
var genericParamsFrom = _curry15(4, (t, arity, env, i) => i >= arity ? [] : match14(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(Some14(tsOf(fromT, env)), genericParamsFrom(toT, arity, env, i + 1))).otherwise(() => _Array_prepend9(None14, genericParamsFrom(t, arity, env, i + 1))));
var genericLambdaParams = _curry15(3, (sc, arity, recs) => {
  const names = genericNames(sc);
  const env = tsEnv(names, recs);
  return eq14(_Map_size2(names), 0) ? None14 : Some14({ generics: `<${_Str_join7(", ", _Map_values2(names))}>`, params: genericParamsFrom(sc.ty, arity, env, 0) });
});
var neverArgs = _curry15(3, (params, i, acc) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, () => neverArgs(params, i + 1, _Array_append12("never", acc))).exhaustive());
var ctorParamTypes = _curry15(5, (fields, params, aliases, recs, i) => match14(_Array_get12(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: fld }) => _Array_prepend9(fieldTs(fld.fieldType, params, aliases, recs), ctorParamTypes(fields, params, aliases, recs, i + 1))).exhaustive());
var ctorFactoryTs = _curry15(5, (typeName, params, c, aliases, recs) => {
  const head = genericHead(params, 0, []);
  const monos = neverArgs(params, 0, []);
  return { generics: head, paramTypes: ctorParamTypes(c.fields, params, aliases, recs, 0), ret: `${typeName}${head}`, retMono: eq14(length12(monos), 0) ? typeName : `${typeName}<${_Str_join7(", ", monos)}>` };
});
var paramDeclName = _curry15(2, (p, i) => match14(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramDeclName(inner, i)).with({ _tag: "LPName" }, ({ name }) => name).with({ _tag: "LPLabeled" }, () => "$lab").otherwise(() => `_${show8(i)}`));
var compositions = (n) => eq14(n, 0) ? [[]] : compositionsFrom(n, 1);
var compositionsFrom = _curry15(2, (n, k) => k > n ? [] : _Array_concat7(map11(_Array_prepend9(k), compositions(n - k)), compositionsFrom(n, k + 1)));
var sliceGroups = _curry15(4, (params, groups, i, at) => match14(_Array_get12(i, groups)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: g }) => _Array_prepend9(_Array_take3(g, _Array_drop3(at, params)), sliceGroups(params, groups, i + 1, at + g))).exhaustive());
var curriedTail = _curry15(3, (slices, i, acc) => i < 1 ? acc : curriedTail(slices, i - 1, `(${_Str_join7(", ", _Option_unwrapOr9([], _Array_get12(i, slices)))}) => ${acc}`));
var overloadSig = _curry15(4, (head, params, ret, groups) => {
  const slices = sliceGroups(params, groups, 0, 0);
  const tail = curriedTail(slices, length12(slices) - 1, ret);
  return `${head}(${_Str_join7(", ", _Option_unwrapOr9([], _Array_get12(0, slices)))}): ${tail};`;
});
var curriedOverloads = _curry15(3, (head, params, ret) => length12(params) <= 1 ? `${head}(${_Str_join7(", ", params)}) => ${ret}` : `{ ${_Str_join7(" ", map11(overloadSig(head, params, ret), _Array_sortBy((g) => 0 - length12(g), compositions(length12(params)))))} }`);
var curriedFnType = _curry15(2, (params, ret) => length12(params) <= 1 ? `(${_Str_join7(", ", params)}) => ${ret}` : `_Curry<[${_Str_join7(", ", params)}], ${ret}>`);
var flatParamsFrom = _curry15(5, (t, value, env, n, acc) => match14(value).with({ _tag: "ELambda" }, ({ params, body }) => eq14(length12(params), 0) ? ((next) => flatParamsFrom(next, body, env, n, acc))(match14(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
}, ({ from: fromT, to: toT }) => toT).otherwise(() => t)) : (([t1, n1, acc1]) => flatParamsFrom(t1, body, env, n1, acc1))(takeParams(t, params, env, 0, n, acc))).otherwise(() => _tuple9(acc, tsOf(t, env))));
var takeParams = _curry15(6, (t, params, env, i, n, acc) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => _tuple9(t, n, acc)).with({ _tag: "Some" }, ({ value: p }) => match14(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => takeParams(toT, params, env, i + 1, n + 1, _Array_append12(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc))).otherwise(() => _tuple9(t, n, acc))).exhaustive());
var declType = _curry15(3, (t, value, env) => match14(value).with({ _tag: "ELambda" }, ({ params, body }) => eq14(length12(params), 0) ? ((next) => `() => ${declType(next, body, env)}`)(match14(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
}, ({ from: fromT, to: toT }) => toT).otherwise(() => t)) : (([t1, _n, ps]) => `(${_Str_join7(", ", ps)}) => ${declType(t1, body, env)}`)(takeParams(t, params, env, 0, 0, []))).otherwise(() => tsOf(t, env)));
var bindingTsType = _curry15(3, (sc, value, recs) => {
  const names = genericNames(sc);
  const env = tsEnv(names, recs);
  const head = eq14(_Map_size2(names), 0) ? "" : `<${_Str_join7(", ", _Map_values2(names))}>`;
  return match14(value).with({ _tag: "ELambda" }, () => eq14(head, "") ? (([params, ret]) => curriedFnType(params, ret))(flatParamsFrom(sc.ty, value, env, 0, [])) : `${head}${declType(sc.ty, value, env)}`).otherwise(() => tsOf(sc.ty, recsEnv(recs)));
});
var spanKey = (sp) => `${show8(sp.start)}:${show8(sp.end)}`;
var typeAtFrom = _curry15(3, (types, i, acc) => match14(_Array_get12(i, types)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: r }) => typeAtFrom(types, i + 1, _Map_set8(spanKey(r.span), r.ty, acc))).exhaustive());
var typeAtTable = (types) => typeAtFrom(types, 0, new Map);
var consInTy = _curry15(2, (t, acc) => match14(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
}, ({ args: [value, error] }) => consInTy(error, consInTy(value, _Set_add6("Result", _Set_add6("Task", acc))))).with({ _tag: "TyCon" }, ({ name, args }) => consInAll(args, _Set_add6(name, acc), 0)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => consInTy(toT, consInTy(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => consInRow(row, acc)).with({ _tag: "TyOneOf" }, ({ members }) => consInAll(members, acc, 0)).otherwise(() => acc));
var consInAll = _curry15(3, (ts, acc, i) => match14(_Array_get12(i, ts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: t }) => consInAll(ts, consInTy(t, acc), i + 1)).exhaustive());
var consInRow = _curry15(2, (row, acc) => match14(row).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => consInRow(rest, consInTy(fieldType, acc))).otherwise(() => acc));
var declaredTypeNames = _curry15(3, (stmts, i, acc) => match14(_Array_get12(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name } }) => declaredTypeNames(stmts, i + 1, _Set_add6(name, acc))).with({ _tag: "Some" }, () => declaredTypeNames(stmts, i + 1, acc)).exhaustive());
var referencedCons = _curry15(4, (stmts, env, i, acc) => match14(_Array_get12(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name } }) => referencedCons(stmts, env, i + 1, _Str_startsWith4("$", name) ? acc : match14(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => consInTy(sc.ty, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "Some" }, () => referencedCons(stmts, env, i + 1, acc)).exhaustive());
var builtinTypeNamesFor = _curry15(4, (declared, wanted, body, i) => match14(_Array_get12(i, builtinTypeDecls)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: bt }) => ((rest) => and10(not10(_Set_has6(bt.name, declared)), or8(_Set_has6(bt.name, wanted), _Str_contains(bt.name, body))) ? _Array_prepend9(bt.name, rest) : rest)(builtinTypeNamesFor(declared, wanted, body, i + 1))).exhaustive());
var aliasRowOf = _curry15(3, (fields, aliases, i) => match14(_Array_get12(i, fields)).with({ _tag: "None" }, () => RowEmpty).with({ _tag: "Some" }, ({ value: f }) => (([t, _vars, _st]) => RowExtend(f.name, t, f.optional, aliasRowOf(fields, aliases, i + 1)))(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray6([])))).exhaustive());
var aliasShapeKey = _curry15(2, (fields, aliases) => rowShapeKey(aliasRowOf(fields, aliases, 0), new Map));
var bareName = (name) => {
  const parts = _Str_split3(".", name);
  return _Option_unwrapOr9(name, _Array_get12(length12(parts) - 1, parts));
};
var indexAlias = _curry15(4, (key, name, aliases, acc) => match14(_Map_get9(key, aliases)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: info }) => match14(info.expr).with({ _tag: "Some" }, () => acc).with({ _tag: "None" }, () => or8(not10(eq14(length12(info.params), 0)), eq14(length12(info.fields), 0)) ? acc : match14(aliasShapeKey(info.fields, aliases)).with({ _tag: "Some" }, ({ value: k }) => _Map_set8(k, name, acc)).with({ _tag: "None" }, () => acc).exhaustive()).exhaustive()).exhaustive());
var recordAliasIndexFrom = _curry15(4, (keys, aliases, i, acc) => match14(_Array_get12(i, keys)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: key }) => recordAliasIndexFrom(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc))).exhaustive());
var recordAliasIndex = (aliases) => recordAliasIndexFrom(_Array_sort2(_Map_keys6(aliases)), aliases, 0, new Map);
var withoutOwnShape = _curry15(4, (fields, params, aliases, recs) => match14(_Array_get12(0, params)).with({ _tag: "Some" }, () => recs).with({ _tag: "None" }, () => match14(aliasShapeKey(fields, aliases)).with({ _tag: "Some" }, ({ value: k }) => _Map_delete2(k, recs)).with({ _tag: "None" }, () => recs).exhaustive()).exhaustive());
var typeHeaderFrom = _curry15(4, (stmts, aliases, recs, i) => match14(_Array_get12(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => match14(alias).with({ _tag: "Some" }, ({ value: fields }) => _Array_prepend9(`${docComment}${recordAliasDecl(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest)).with({ _tag: "None" }, () => match14(aliasType).with({ _tag: "Some" }, ({ value: te }) => _Array_prepend9(`${docComment}${aliasTsDecl(name, params, te, aliases, recs)}`, rest)).with({ _tag: "None" }, () => eq14(length12(ctors), 0) ? _Array_prepend9(`declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`, rest) : _Array_prepend9(`${docComment}${typeDecl(name, params, ctors, aliases, recs)}`, rest)).exhaustive()).exhaustive())(jsDoc(doc)))(typeHeaderFrom(stmts, aliases, recs, i + 1))).with({ _tag: "Some" }, () => typeHeaderFrom(stmts, aliases, recs, i + 1)).exhaustive());
var genericLambdasFrom = _curry15(4, (stmts, env, i, acc) => match14(_Array_get12(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value } }) => genericLambdasFrom(stmts, env, i + 1, match14(value).with((_v) => {
  const _g = _v;
  return _g._tag === "ELambda" && (({ span: sp }) => not10(_Str_startsWith4("$", name)))(_g);
}, ({ span: sp }) => match14(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => or8(length12(sc.vars) > 0, length12(sc.rvars) > 0) ? _Map_set8(spanKey(sp), sc, acc) : acc).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).with({ _tag: "Some" }, () => genericLambdasFrom(stmts, env, i + 1, acc)).exhaustive());
var scopedSpans = (e) => match14(e).with({ _tag: "ELambda" }, ({ body, span: sp }) => _Array_prepend9(sp, scopedSpans(body))).with({ _tag: "ECall" }, ({ fn, args }) => _Array_concat7(scopedSpans(fn), scopedSpansAt(args, 0))).with({ _tag: "ELetIn" }, ({ value, body }) => _Array_concat7(scopedSpans(value), scopedSpans(body))).with({ _tag: "ELetBind" }, ({ value, body }) => _Array_concat7(scopedSpans(value), scopedSpans(body))).with({ _tag: "EPipe" }, ({ left, right }) => _Array_concat7(scopedSpans(left), scopedSpans(right))).with({ _tag: "EDo" }, ({ exprs }) => scopedSpansAt(exprs, 0)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Array_concat7(scopedSpans(cond), _Array_concat7(scopedSpans(thenE), scopedSpans(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Array_concat7(scopedSpans(scrutinee), scopedSpansInArms(arms, 0))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Array_concat7(scopedSpansInFields(fields, 0), match14(spread).with({ _tag: "Some" }, ({ value: s }) => scopedSpans(s)).with({ _tag: "None" }, () => []).exhaustive())).with({ _tag: "EField" }, ({ target, name, span: sp }) => ((rest) => and10(eq14(name, "empty"), isRefExpr(target)) ? _Array_prepend9(sp, rest) : rest)(scopedSpans(target))).with({ _tag: "ETuple" }, ({ elements }) => scopedSpansAt(elements, 0)).with({ _tag: "EArr" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "EList" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "ESet" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "EMap" }, ({ entries, span: sp }) => ((inner) => eq14(length12(entries), 0) ? _Array_prepend9(sp, inner) : inner)(scopedSpansInEntries(entries, 0))).with({ _tag: "ELoop" }, ({ params, body }) => _Array_concat7(scopedSpansInLoop(params, 0), scopedSpans(body))).with({ _tag: "ERecur" }, ({ args }) => scopedSpansAt(args, 0)).with({ _tag: "EInterp" }, ({ parts }) => scopedSpansInParts(parts, 0)).otherwise(() => []);
var isRefExpr = (e) => match14(e).with({ _tag: "ERef" }, () => true).otherwise(() => false);
var scopedSpansAt = _curry15(2, (exprs, i) => match14(_Array_get12(i, exprs)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: e }) => _Array_concat7(scopedSpans(e), scopedSpansAt(exprs, i + 1))).exhaustive());
var scopedSpansInArms = _curry15(2, (arms, i) => match14(_Array_get12(i, arms)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => _Array_concat7(match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => scopedSpans(g)).with({ _tag: "None" }, () => []).exhaustive(), _Array_concat7(scopedSpans(a.body), scopedSpansInArms(arms, i + 1)))).exhaustive());
var scopedSpansInFields = _curry15(2, (fields, i) => match14(_Array_get12(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_concat7(scopedSpans(f.value), scopedSpansInFields(fields, i + 1))).exhaustive());
var scopedSpansInEntries = _curry15(2, (entries, i) => match14(_Array_get12(i, entries)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: en }) => _Array_concat7(scopedSpans(en.key), _Array_concat7(scopedSpans(en.value), scopedSpansInEntries(entries, i + 1)))).exhaustive());
var scopedSpansInElems = _curry15(2, (elements, i) => match14(_Array_get12(i, elements)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SEExpr";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInElems(elements, i + 1))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SESpread";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInElems(elements, i + 1))).exhaustive());
var scopedSpansInSeq = _curry15(2, (elements, sp) => {
  const inner = scopedSpansInElems(elements, 0);
  return eq14(length12(elements), 0) ? _Array_prepend9(sp, inner) : inner;
});
var scopedSpansInLoop = _curry15(2, (params, i) => match14(_Array_get12(i, params)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: p }) => _Array_concat7(scopedSpans(p.init), scopedSpansInLoop(params, i + 1))).exhaustive());
var scopedSpansInParts = _curry15(2, (parts, i) => match14(_Array_get12(i, parts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "IPExpr";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInParts(parts, i + 1))).with({ _tag: "Some" }, () => scopedSpansInParts(parts, i + 1)).exhaustive());
var scopedNamesAt = _curry15(4, (spans, i, names, acc) => match14(_Array_get12(i, spans)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: sp }) => scopedNamesAt(spans, i + 1, names, _Map_set8(spanKey(sp), names, acc))).exhaustive());
var scopedNamesFrom = _curry15(4, (stmts, env, i, acc) => match14(_Array_get12(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value } }) => scopedNamesFrom(stmts, env, i + 1, match14(value).with((_v) => {
  const _g = _v;
  return _g._tag === "ELambda" && not10(_Str_startsWith4("$", name));
}, () => match14(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => or8(length12(sc.vars) > 0, length12(sc.rvars) > 0) ? scopedNamesAt(scopedSpans(value), 0, unionGenericNames([sc]), acc) : acc).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).with({ _tag: "Some" }, () => scopedNamesFrom(stmts, env, i + 1, acc)).exhaustive());
var tsGenOpts = _curry15(5, (stmts, env, types, letParams, aliases) => {
  const typeAt = typeAtTable(types);
  const letParamAt = typeAtTable(letParams);
  const genericLams = genericLambdasFrom(stmts, env, 0, new Map);
  const scopedNames = scopedNamesFrom(stmts, env, 0, new Map);
  const recs = recordAliasIndex(aliases);
  const typeOf = (e) => _Map_get9(spanKey(exprSpan3(e)), typeAt);
  const envAt = (key) => match14(_Map_get9(key, scopedNames)).with({ _tag: "Some" }, ({ value: vars }) => tsEnv(vars, recs)).with({ _tag: "None" }, () => recsEnv(recs)).exhaustive();
  return { ...jsGenOpts, annotateLet: Some14(_curry15(2, (name, value) => _Str_startsWith4("$", name) ? None14 : match14(value).with({ _tag: "ELambda" }, () => match14(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => Some14(`: ${bindingTsType(sc, value, recs)}`)).with({ _tag: "None" }, () => None14).exhaustive()).otherwise(() => _Option_map3((ts) => `: ${ts}`, _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt)))))), annotateCtor: Some14(_curry15(2, (s, c) => match14(s).with({ _tag: "SType" }, ({ name, params }) => Some14(ctorFactoryTs(name, params, c, aliases, recs))).otherwise(() => None14))), annotateParams: Some14(_curry15(2, (sp, arity) => match14(_Map_get9(spanKey(sp), genericLams)).with({ _tag: "Some" }, ({ value: sc }) => _Option_unwrapOr9({ generics: "", params: [] }, genericLambdaParams(sc, arity, recs))).with({ _tag: "None" }, () => ({ generics: "", params: match14(_Map_get9(spanKey(sp), typeAt)).with({ _tag: "Some" }, ({ value: t }) => lambdaParamTypesTs(t, arity, envAt(spanKey(sp)))).with({ _tag: "None" }, () => []).exhaustive() })).exhaustive())), annotateEmpty: Some14((e) => {
    const key = spanKey(exprSpan3(e));
    return _Option_flatMap3((t) => emptyCollTs(t, envAt(key)), _Map_get9(key, typeAt));
  }), annotateLetin: Some14((value) => _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt))), annotateCall: Some14((e) => _Option_flatMap3((t) => ctorCallTs(t, recs), typeOf(e))), guardBaseType: Some14((e) => _Option_flatMap3((t) => guardParamTs(t, recs), typeOf(e))), flattenPipe: true, tupleHelper: true, preserveInfix: true, preserveJsx: true, moduleExt: "" };
});
var anyOf = _curry15(2, (f, xs) => reduce4(_curry15(2, (acc, x) => or8(acc, f(x))), false, xs));
var hasJsxExpr = (e) => match14(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "Some" && _g.origin.value === "jsx";
}, () => true).with({ _tag: "ECall" }, ({ fn, args }) => or8(hasJsxExpr(fn), anyOf(hasJsxExpr, args))).with({ _tag: "ELambda" }, ({ body }) => hasJsxExpr(body)).with({ _tag: "ELetIn" }, ({ value, body }) => or8(hasJsxExpr(value), hasJsxExpr(body))).with({ _tag: "ELetBind" }, ({ value, body }) => or8(hasJsxExpr(value), hasJsxExpr(body))).with({ _tag: "EPipe" }, ({ left, right }) => or8(hasJsxExpr(left), hasJsxExpr(right))).with({ _tag: "EDo" }, ({ exprs }) => anyOf(hasJsxExpr, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or8(or8(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or8(hasJsxExpr(scrutinee), anyOf((a) => or8(match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => hasJsxExpr(g)).with({ _tag: "None" }, () => false).exhaustive(), hasJsxExpr(a.body)), arms))).with({ _tag: "ERecord" }, ({ fields, spread }) => or8(anyOf((f) => hasJsxExpr(f.value), fields), match14(spread).with({ _tag: "Some" }, ({ value }) => hasJsxExpr(value)).with({ _tag: "None" }, () => false).exhaustive())).with({ _tag: "EField" }, ({ target }) => hasJsxExpr(target)).with({ _tag: "ETuple" }, ({ elements }) => anyOf(hasJsxExpr, elements)).with({ _tag: "EArr" }, ({ elements }) => anyOf((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "EList" }, ({ elements }) => anyOf((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "ESet" }, ({ elements }) => anyOf((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "EMap" }, ({ entries }) => anyOf((entry) => or8(hasJsxExpr(entry.key), hasJsxExpr(entry.value)), entries)).with({ _tag: "ELoop" }, ({ params, body }) => or8(anyOf((p) => hasJsxExpr(p.init), params), hasJsxExpr(body))).with({ _tag: "ERecur" }, ({ args }) => anyOf(hasJsxExpr, args)).with({ _tag: "EInterp" }, ({ parts }) => anyOf((part) => match14(part).with({ _tag: "IPLit" }, () => false).with({ _tag: "IPExpr" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), parts)).otherwise(() => false);
var hasJsxStmts = (stmts) => anyOf((stmt) => match14(stmt).with({ _tag: "SLet" }, ({ value }) => hasJsxExpr(value)).with({ _tag: "SExpr" }, ({ value }) => hasJsxExpr(value)).otherwise(() => false), stmts);
var emitTsModule = _curry15(11, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport) => {
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray6([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray6([]));
  const recs = recordAliasIndex(aliases);
  const typeHeader = typeHeaderFrom(stmts, aliases, recs, 0);
  const body = codegenWith(stmts, imported, false, ns, jsDefs, runtimeDeps, tsGenOpts(stmts, env, types, letParams, aliases));
  const deps0 = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
  const deps = _Str_contains("_tuple(", body) ? _Array_append12("_tuple", deps0) : deps0;
  return ((deps2) => ((runtimeLine) => ((header) => ((typeDeps) => ((typeImportLine) => concat2(`${hasJsxStmts(stmts) ? `/** @jsx h */

` : ""}${_Str_join7(`

`, filter5((part) => not10(eq14(part, "")), [_Str_join7(`
`, header), _Str_join7(`
`, importLines), typeImportLine, runtimeLine, body]))}`, `
`))(eq14(length12(typeDeps), 0) ? "" : `import type { ${_Str_join7(", ", _Array_sort2(typeDeps))} } from "${runtimeImport}";`))(_Array_concat7(_Str_contains("_Curry<", `${_Str_join7(`
`, header)}
${body}`) ? ["_Curry"] : [], builtinTypeNamesFor(declared, wanted, body, 0))))(typeHeader))(eq14(length12(deps2), 0) ? "" : `import { ${_Str_join7(", ", _Array_sort2(deps2))} } from "${runtimeImport}";`))(filter5((d) => or8(and10(and10(and10(and10(and10(and10(and10(not10(eq14(d, "add")), not10(eq14(d, "sub"))), not10(eq14(d, "mul"))), not10(eq14(d, "div"))), not10(eq14(d, "lt"))), not10(eq14(d, "lte"))), not10(eq14(d, "gt"))), not10(eq14(d, "gte"))), _Str_contains(d, body)), deps));
});
var freeIdsIn = _curry15(2, (t, acc) => match14(t).with({ _tag: "TyVar" }, ({ id }) => _Array_contains4(id, acc) ? acc : _Array_append12(id, acc)).with({ _tag: "TyCon" }, ({ args }) => freeIdsInAll(args, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => freeIdsIn(toT, freeIdsIn(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => freeIdsInRow(row, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => freeIdsInAll(members, acc)).exhaustive());
var freeIdsInAll = _curry15(2, (ts, acc) => reduce4(_curry15(2, (a, t) => freeIdsIn(t, a)), acc, ts));
var freeIdsInRow = _curry15(2, (row, acc) => match14(row).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => freeIdsInRow(rest, freeIdsIn(fieldType, acc))).otherwise(() => acc));
var lettersFor = _curry15(3, (ids, i, acc) => match14(_Array_get12(i, ids)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: id }) => lettersFor(ids, i + 1, _Map_set8(id, letterAt(i), acc))).exhaustive());
var anyFor = (ids) => reduce4(_curry15(2, (acc, id) => _Map_set8(id, "any", acc)), new Map, ids);
var genericHeadOf = _curry15(2, (ids, names) => eq14(length12(ids), 0) ? "" : `<${_Str_join7(", ", _Map_values2(names))}>`);
var arrowCount = (t) => match14(t).with({ _tag: "TyFn" }, ({ to: toT }) => 1 + arrowCount(toT)).otherwise(() => 0);
var hostParams = _curry15(4, (t, arity, names, i) => i >= arity ? [] : match14(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(`${_Str_fromCode3(97 + i)}: ${tsOf(fromT, plainEnv(names))}`, hostParams(toT, arity, names, i + 1))).otherwise(() => []));
var hostReturn = _curry15(3, (t, arity, i) => i >= arity ? t : match14(t).with({ _tag: "TyFn" }, ({ to: toT }) => hostReturn(toT, arity, i + 1)).otherwise(() => t));
var curriedHostType = _curry15(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  return `${genericHeadOf(ids, names)}${reduce4(_curry15(2, (acc, p) => `(${p}) => ${acc}`), tsOf(hostReturn(t, arity, 0), plainEnv(names)), _Array_reverse2(hostParams(t, arity, names, 0)))}`;
});
var flatHostType = _curry15(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  const head = genericHeadOf(ids, names);
  return eq14(arity, 0) ? `${head}${tsOf(t, plainEnv(names))}` : curriedOverloads(head, hostParams(t, arity, names, 0), tsOf(hostReturn(t, arity, 0), plainEnv(names)));
});
var externDecl = (e) => {
  const t = e.scheme.ty;
  const n = arrowCount(t);
  return and10(n >= 1, e.curried) ? `export declare const ${e.imported}: ${curriedHostType(t, n)};` : eq14(n, 0) ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn(t, []))))};` : `export declare const ${e.imported}: ${flatHostType(t, n)};`;
};
var externModuleDts = _curry15(2, (externs, aliases) => {
  const wanted = reduce4(_curry15(2, (acc, e) => consInTy(e.scheme.ty, acc)), _Set_fromArray6([]), externs);
  return concat2(_Str_join7(`
`, _Array_concat7(map11((bt) => typeDecl(bt.name, bt.params, bt.ctors, aliases, new Map), filter5((bt) => _Set_has6(bt.name, wanted), builtinTypeDecls)), map11(externDecl, _Array_dedupeBy((e) => e.imported, externs)))), `
`);
});

import { _Array_append as _Array_append13, _Array_concat as _Array_concat8, _Array_get as _Array_get13, _Array_prepend as _Array_prepend10, _Map_get as _Map_get10, _Map_set as _Map_set9, _curry as _curry16, _tuple as _tuple10 } from "@mochi/compiler/runtime";
import { match as match15 } from "@onrails/pattern";
var def = _curry16(2, (name, span) => ({ name, defStart: span.start, defEnd: span.end, start: span.start, end: span.end, role: "def" }));
var use = _curry16(3, (name, span, env) => match15(_Map_get10(name, env)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: binding }) => [{ name, defStart: binding.start, defEnd: binding.end, start: span.start, end: span.end, role: "use" }]).exhaustive());
var bind = _curry16(3, (name, span, env) => _Map_set9(name, { name, start: span.start, end: span.end }, env));
var bindSpannedNames = _curry16(4, (names, spans, env, i) => match15(_tuple10(_Array_get13(i, names), _Array_get13(i, spans))).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "Some" && _g[1]._tag === "Some";
}, ([{ value: name }, { value: span }]) => ((tail) => ({ env: tail.env, occurrences: _Array_prepend10(def(name, span), tail.occurrences) }))(bindSpannedNames(names, spans, bind(name, span, env), i + 1))).otherwise(() => ({ env, occurrences: [] })));
var bindParam2 = _curry16(2, (param, env) => match15(param).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPName" && _g.nameSpans.length === 1;
}, ({ param: { name }, nameSpans: [span] }) => ({ env: bind(name, span, env), occurrences: [def(name, span)] })).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPLabeled" && _g.nameSpans.length === 1;
}, ({ param: { name }, nameSpans: [span] }) => ({ env: bind(name, span, env), occurrences: [def(name, span)] })).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPTuple";
}, ({ param: { names }, nameSpans: spans }) => bindSpannedNames(names, spans, env, 0)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPRecord";
}, ({ param: { fields: names }, nameSpans: spans }) => bindSpannedNames(names, spans, env, 0)).otherwise(() => ({ env, occurrences: [] })));
var bindParams = _curry16(3, (params, env, i) => match15(_Array_get13(i, params)).with({ _tag: "None" }, () => ({ env, occurrences: [] })).with({ _tag: "Some" }, ({ value: param }) => ((head) => ((tail) => ({ env: tail.env, occurrences: _Array_concat8(head.occurrences, tail.occurrences) }))(bindParams(params, head.env, i + 1)))(bindParam2(param, env))).exhaustive());
var walkExprs = _curry16(3, (exprs, env, i) => match15(_Array_get13(i, exprs)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: expr }) => _Array_concat8(walkExpr(expr, env), walkExprs(exprs, env, i + 1))).exhaustive());
var walkSeqs = _curry16(3, (elems, env, i) => match15(_Array_get13(i, elems)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SEExpr";
}, ({ value: { expr } }) => _Array_concat8(walkExpr(expr, env), walkSeqs(elems, env, i + 1))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SESpread";
}, ({ value: { expr } }) => _Array_concat8(walkExpr(expr, env), walkSeqs(elems, env, i + 1))).exhaustive());
var walkPattern = _curry16(2, (pat, env) => match15(pat).with({ _tag: "PBind" }, ({ name, span }) => ({ env: bind(name, span, env), occurrences: [def(name, span)] })).with({ _tag: "PAs" }, ({ pat: inner, name, nameSpan }) => ((innerResult) => ({ env: bind(name, nameSpan, innerResult.env), occurrences: _Array_append13(def(name, nameSpan), innerResult.occurrences) }))(walkPattern(inner, env))).with({ _tag: "PTuple" }, ({ elems }) => walkPatterns(elems, env, 0)).with({ _tag: "PRecord" }, ({ fields }) => walkPatFields(fields, env, 0)).with({ _tag: "PCtor" }, ({ args }) => walkPatterns(args, env, 0)).with({ _tag: "PArr" }, ({ elems, rest }) => ((result) => match15(rest).with({ _tag: "None" }, () => result).with({ _tag: "Some" }, ({ value: tail }) => ((tailResult) => ({ env: tailResult.env, occurrences: _Array_concat8(result.occurrences, tailResult.occurrences) }))(walkPattern(tail, result.env))).exhaustive())(walkPatterns(elems, env, 0))).with({ _tag: "PList" }, ({ elems, rest }) => ((result) => match15(rest).with({ _tag: "None" }, () => result).with({ _tag: "Some" }, ({ value: tail }) => ((tailResult) => ({ env: tailResult.env, occurrences: _Array_concat8(result.occurrences, tailResult.occurrences) }))(walkPattern(tail, result.env))).exhaustive())(walkPatterns(elems, env, 0))).with((_v) => {
  const _g = _v;
  return _g._tag === "POr" && _g.alts.length >= 1;
}, ({ alts: [first] }) => walkPattern(first, env)).otherwise(() => ({ env, occurrences: [] })));
var walkPatterns = _curry16(3, (patterns, env, i) => match15(_Array_get13(i, patterns)).with({ _tag: "None" }, () => ({ env, occurrences: [] })).with({ _tag: "Some" }, ({ value: pat }) => ((head) => ((tail) => ({ env: tail.env, occurrences: _Array_concat8(head.occurrences, tail.occurrences) }))(walkPatterns(patterns, head.env, i + 1)))(walkPattern(pat, env))).exhaustive());
var walkPatFields = _curry16(3, (fields, env, i) => match15(_Array_get13(i, fields)).with({ _tag: "None" }, () => ({ env, occurrences: [] })).with({ _tag: "Some" }, ({ value: field }) => ((head) => ((tail) => ({ env: tail.env, occurrences: _Array_concat8(head.occurrences, tail.occurrences) }))(walkPatFields(fields, head.env, i + 1)))(walkPattern(field.pat, env))).exhaustive());
var walkArms = _curry16(3, (arms, env, i) => match15(_Array_get13(i, arms)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: arm }) => ((pat) => ((guard) => _Array_concat8(pat.occurrences, _Array_concat8(guard, _Array_concat8(walkExpr(arm.body, pat.env), walkArms(arms, env, i + 1)))))(match15(arm.guard).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: expr }) => walkExpr(expr, pat.env)).exhaustive()))(walkPattern(arm.pattern, env))).exhaustive());
var walkFields = _curry16(3, (fields, env, i) => match15(_Array_get13(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: field }) => _Array_concat8(walkExpr(field.value, env), walkFields(fields, env, i + 1))).exhaustive());
var walkEntries = _curry16(3, (entries, env, i) => match15(_Array_get13(i, entries)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: entry }) => _Array_concat8(walkExpr(entry.key, env), _Array_concat8(walkExpr(entry.value, env), walkEntries(entries, env, i + 1)))).exhaustive());
var walkLoopParams = _curry16(3, (params, env, i) => match15(_Array_get13(i, params)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: param }) => _Array_concat8(walkExpr(param.init, env), walkLoopParams(params, env, i + 1))).exhaustive());
var loopEnv = _curry16(3, (params, env, i) => match15(_Array_get13(i, params)).with({ _tag: "None" }, () => env).with({ _tag: "Some" }, ({ value: param }) => loopEnv(params, bind(param.name, param.nameSpan, env), i + 1)).exhaustive());
var loopDefs = _curry16(2, (params, i) => match15(_Array_get13(i, params)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: param }) => _Array_concat8([def(param.name, param.nameSpan)], loopDefs(params, i + 1))).exhaustive());
var walkExpr = _curry16(2, (expr, env) => match15(expr).with({ _tag: "ERef" }, ({ name, span }) => use(name, span, env)).with({ _tag: "ECall" }, ({ fn, args }) => _Array_concat8(walkExpr(fn, env), walkExprs(args, env, 0))).with({ _tag: "ELambda" }, ({ params, body }) => ((bound) => _Array_concat8(bound.occurrences, walkExpr(body, bound.env)))(bindParams(params, env, 0))).with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body }) => ((recursive) => ((bodyEnv) => recursive ? _Array_concat8([def(name, nameSpan)], _Array_concat8(walkExpr(value, bodyEnv), walkExpr(body, bodyEnv))) : _Array_concat8(walkExpr(value, env), _Array_concat8([def(name, nameSpan)], walkExpr(body, bodyEnv))))(bind(name, nameSpan, env)))(match15(value).with({ _tag: "ELambda" }, () => true).otherwise(() => false))).with({ _tag: "ELetBind" }, ({ value, body }) => _Array_concat8(walkExpr(value, env), walkExpr(body, env))).with({ _tag: "EPipe" }, ({ left, right }) => _Array_concat8(walkExpr(left, env), walkExpr(right, env))).with({ _tag: "EDo" }, ({ exprs }) => walkExprs(exprs, env, 0)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Array_concat8(walkExpr(cond, env), _Array_concat8(walkExpr(thenE, env), walkExpr(elseE, env)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Array_concat8(walkExpr(scrutinee, env), walkArms(arms, env, 0))).with({ _tag: "ERecord" }, ({ fields, spread }) => match15(spread).with({ _tag: "None" }, () => walkFields(fields, env, 0)).with({ _tag: "Some" }, ({ value: base }) => _Array_concat8(walkExpr(base, env), walkFields(fields, env, 0))).exhaustive()).with({ _tag: "EField" }, ({ target }) => walkExpr(target, env)).with({ _tag: "ETuple" }, ({ elements }) => walkExprs(elements, env, 0)).with({ _tag: "EArr" }, ({ elements }) => walkSeqs(elements, env, 0)).with({ _tag: "EList" }, ({ elements }) => walkSeqs(elements, env, 0)).with({ _tag: "ESet" }, ({ elements }) => walkSeqs(elements, env, 0)).with({ _tag: "EMap" }, ({ entries }) => walkEntries(entries, env, 0)).with({ _tag: "ELoop" }, ({ params, body }) => ((scoped) => _Array_concat8(walkLoopParams(params, env, 0), _Array_concat8(loopDefs(params, 0), walkExpr(body, scoped))))(loopEnv(params, env, 0))).with({ _tag: "ERecur" }, ({ args }) => walkExprs(args, env, 0)).with({ _tag: "EInterp" }, ({ parts }) => walkInterp(parts, env, 0)).otherwise(() => []));
var walkInterp = _curry16(3, (parts, env, i) => match15(_Array_get13(i, parts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "IPLit";
}, () => walkInterp(parts, env, i + 1)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "IPExpr";
}, ({ value: { expr } }) => _Array_concat8(walkExpr(expr, env), walkInterp(parts, env, i + 1))).exhaustive());
var topEnv = _curry16(3, (stmts, env, i) => match15(_Array_get13(i, stmts)).with({ _tag: "None" }, () => env).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SExtern";
}, ({ value: { name, nameSpan: span } }) => topEnv(stmts, bind(name, span, env), i + 1)).with({ _tag: "Some" }, () => topEnv(stmts, env, i + 1)).exhaustive());
var topDefs = _curry16(2, (stmts, i) => match15(_Array_get13(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, nameSpan: span } }) => _Array_concat8([def(name, span)], topDefs(stmts, i + 1))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SExtern";
}, ({ value: { name, nameSpan: span } }) => _Array_concat8([def(name, span)], topDefs(stmts, i + 1))).with({ _tag: "Some" }, () => topDefs(stmts, i + 1)).exhaustive());
var walkStmts = _curry16(3, (stmts, env, i) => match15(_Array_get13(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { value } }) => _Array_concat8(walkExpr(value, env), walkStmts(stmts, env, i + 1))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SExpr";
}, ({ value: { value } }) => _Array_concat8(walkExpr(value, env), walkStmts(stmts, env, i + 1))).with({ _tag: "Some" }, () => walkStmts(stmts, env, i + 1)).exhaustive());
var index = (stmts) => {
  const env = topEnv(stmts, new Map, 0);
  return _Array_concat8(topDefs(stmts, 0), walkStmts(stmts, env, 0));
};

import { _Array_concat as _Array_concat9, _Array_contains as _Array_contains5, _Array_get as _Array_get14, _Array_prepend as _Array_prepend11, _Map_get as _Map_get11, _Map_getOr as _Map_getOr7, _Map_has as _Map_has5, _Map_keys as _Map_keys7, _Map_set as _Map_set10, _Result_map as _Result_map6, _Set_add as _Set_add7, _Set_fromArray as _Set_fromArray7, _Set_has as _Set_has7, _Set_toArray as _Set_toArray4, _Str_contains as _Str_contains2, _Str_endsWith as _Str_endsWith3, _Str_join as _Str_join8, _Str_length as _Str_length4, _Str_slice as _Str_slice4, _Str_startsWith as _Str_startsWith5, _curry as _curry18, eq as eq15, length as length13, map as map13, not as not11, or as or9 } from "@mochi/compiler/runtime";
import { match as match16 } from "@onrails/pattern";

import { Ok as Ok9, _Result_flatMap as _Result_flatMap7, _curry as _curry17, _tuple as _tuple11, map as map12 } from "@mochi/compiler/runtime";

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

var frontend = ($x) => _Result_flatMap7(check)((($x2) => _Result_flatMap7(parse)(lex($x2)))($x));
var typedProgram = (src) => _Result_flatMap7((stmts) => _Result_flatMap7((r) => Ok9(_tuple11(stmts, r)), inferProgramTypes(stmts, builtins, namespaces, false)), frontend(src));
var noImportedKeys = new Map;
var compileTs = _curry17(2, (src, runtimeImport) => _Result_flatMap7((stmts) => _Result_flatMap7((r) => Ok9(emitTsModule(stmts, r.env, r.types, r.letParams, r.aliases, noImportedKeys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, runtimeImport)), inferProgramTypes(stmts, builtins, namespaces, false)), frontend(src)));

var writtenQualsIn = _curry18(3, (te, local, acc) => match16(te).with({ _tag: "TyName" }, () => acc).with({ _tag: "TyLit" }, () => acc).with({ _tag: "TyArrow" }, ({ from, to }) => writtenQualsIn(to, local, writtenQualsIn(from, local, acc))).with({ _tag: "TyApp" }, ({ args }) => writtenQualsInAll(args, local, acc, 0)).with({ _tag: "TyTuple" }, ({ elems }) => writtenQualsInAll(elems, local, acc, 0)).with({ _tag: "TyList" }, ({ elem }) => writtenQualsIn(elem, local, acc)).with({ _tag: "TyUnion" }, ({ members }) => writtenQualsInAll(members, local, acc, 0)).with({ _tag: "TyQual" }, ({ alias, name, args }) => ((acc1) => writtenQualsInAll(args, local, acc1, 0))(or9(_Set_has7(name, local), _Map_has5(name, acc)) ? acc : _Map_set10(name, `${alias}.${name}`, acc))).exhaustive());
var writtenQualsInAll = _curry18(4, (tes, local, acc, i) => match16(_Array_get14(i, tes)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: te }) => writtenQualsInAll(tes, local, writtenQualsIn(te, local, acc), i + 1)).exhaustive());
var ctorQualsFrom = _curry18(4, (ctors, local, acc, i) => match16(_Array_get14(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => ctorQualsFrom(ctors, local, writtenQualsInAll(map13((f) => f.fieldType, c.fields), local, acc, 0), i + 1)).exhaustive());
var writtenQualsFrom = _curry18(4, (stmts, local, acc, i) => match16(_Array_get14(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SExtern";
}, ({ value: { typeExpr: te } }) => writtenQualsFrom(stmts, local, writtenQualsIn(te, local, acc), i + 1)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { annot } }) => writtenQualsFrom(stmts, local, match16(annot).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: te }) => writtenQualsIn(te, local, acc)).exhaustive(), i + 1)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { ctors, alias, aliasType } }) => ((acc1) => ((acc2) => ((acc3) => writtenQualsFrom(stmts, local, acc3, i + 1))(match16(aliasType).with({ _tag: "None" }, () => acc2).with({ _tag: "Some" }, ({ value: te }) => writtenQualsIn(te, local, acc2)).exhaustive()))(match16(alias).with({ _tag: "None" }, () => acc1).with({ _tag: "Some" }, ({ value: fields }) => writtenQualsInAll(map13((f) => f.fieldType, fields), local, acc1, 0)).exhaustive()))(ctorQualsFrom(ctors, local, acc, 0))).with({ _tag: "Some" }, () => writtenQualsFrom(stmts, local, acc, i + 1)).exhaustive());
var qualifyRow = _curry18(2, (row, qualify) => match16(row).with({ _tag: "RowEmpty" }, () => RowEmpty).with({ _tag: "RowVar" }, ({ id }) => RowVar(id)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => RowExtend(label, qualifyTy(fieldType, qualify), optional, qualifyRow(rest, qualify))).exhaustive());
var qualifyTy = _curry18(2, (t, qualify) => match16(t).with({ _tag: "TyVar" }, ({ id }) => TyVar(id)).with({ _tag: "TyCon" }, ({ name, args }) => TyCon(_Map_getOr7(name, name, qualify), map13((a) => qualifyTy(a, qualify), args))).with({ _tag: "TyFn" }, ({ from, to }) => TyFn(qualifyTy(from, qualify), qualifyTy(to, qualify))).with({ _tag: "TyRecord" }, ({ row }) => TyRecord(qualifyRow(row, qualify))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => TyOneOf(map13((m) => qualifyTy(m, qualify), members))).exhaustive());
var qualifyTe2 = _curry18(2, (te, qualify) => match16(te).with({ _tag: "TyName" }, ({ name, span }) => TyName(_Map_getOr7(name, name, qualify), span)).with({ _tag: "TyArrow" }, ({ from, to, span }) => TyArrow(qualifyTe2(from, qualify), qualifyTe2(to, qualify), span)).with({ _tag: "TyApp" }, ({ ctor, args, span }) => TyApp(_Map_getOr7(ctor, ctor, qualify), map13((a) => qualifyTe2(a, qualify), args), span)).with({ _tag: "TyTuple" }, ({ elems, span }) => TyTuple(map13((e) => qualifyTe2(e, qualify), elems), span)).with({ _tag: "TyList" }, ({ elem, span }) => TyList(qualifyTe2(elem, qualify), span)).with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span }) => TyQual(alias, name, nameSpan, map13((a) => qualifyTe2(a, qualify), args), span)).with({ _tag: "TyLit" }, ({ value, span }) => TyLit(value, span)).with({ _tag: "TyUnion" }, ({ members, span }) => TyUnion(map13((m) => qualifyTe2(m, qualify), members), span)).exhaustive());
var qualifyField2 = _curry18(2, (f, qualify) => ({ name: f.name, fieldType: qualifyTe2(f.fieldType, qualify) }));
var qualifyCtor = _curry18(2, (c, qualify) => ({ name: c.name, fields: map13((f) => qualifyField2(f, qualify), c.fields) }));
var qualifyAliasField = _curry18(2, (f, qualify) => ({ name: f.name, fieldType: qualifyTe2(f.fieldType, qualify), optional: f.optional }));
var typeDeclsFrom = _curry18(5, (stmts, aliases, recs, qualify, i) => match16(_Array_get14(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => match16(alias).with({ _tag: "Some" }, ({ value: fields }) => _Array_prepend11(`${docComment}${recordAliasDecl(name, params, map13((f) => qualifyAliasField(f, qualify), fields), aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest)).with({ _tag: "None" }, () => match16(aliasType).with({ _tag: "Some" }, ({ value: te }) => _Array_prepend11(`${docComment}${aliasTsDecl(name, params, qualifyTe2(te, qualify), aliases, recs)}`, rest)).with({ _tag: "None" }, () => eq15(length13(ctors), 0) ? _Array_prepend11(`${docComment}${opaqueTypeDecl(name)}`, rest) : _Array_prepend11(`${docComment}${typeDecl(name, params, map13((c) => qualifyCtor(c, qualify), ctors), aliases, recs)}`, rest)).exhaustive()).exhaustive())(jsDoc(doc)))(typeDeclsFrom(stmts, aliases, recs, qualify, i + 1))).with({ _tag: "Some" }, () => typeDeclsFrom(stmts, aliases, recs, qualify, i + 1)).exhaustive());
var bindingDeclsFrom = _curry18(5, (stmts, env, recs, qualify, i) => match16(_Array_get14(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value, doc } }) => ((rest) => _Str_startsWith5("$", name) ? rest : match16(_Map_get11(name, env)).with({ _tag: "None" }, () => rest).with({ _tag: "Some" }, ({ value: sc }) => _Array_prepend11(`${jsDoc(doc)}export declare const ${name}: ${bindingTsType({ vars: sc.vars, rvars: sc.rvars, ty: qualifyTy(sc.ty, qualify) }, value, recs)};`, rest)).exhaustive())(bindingDeclsFrom(stmts, env, recs, qualify, i + 1))).with({ _tag: "Some" }, () => bindingDeclsFrom(stmts, env, recs, qualify, i + 1)).exhaustive());
var builtinDeclsFor2 = _curry18(4, (names, aliases, recs, i) => match16(_Array_get14(i, builtinTypeDecls)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: bt }) => ((rest) => _Array_contains5(bt.name, names) ? _Array_prepend11(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest) : rest)(builtinDeclsFor2(names, aliases, recs, i + 1))).exhaustive());
var mochiDtsSpec = (from) => {
  const bare = _Str_endsWith3(".mochi", from) ? _Str_slice4(0, _Str_length4(from) - 6, from) : from;
  return or9(_Str_startsWith5("./", bare), _Str_startsWith5("../", bare)) ? `${bare}.mochi` : from;
};
var nsTypeImportsFrom = _curry18(4, (stmts, body, seen, i) => match16(_Array_get14(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SImportNs";
}, ({ value: { alias, from } }) => or9(_Set_has7(alias.name, seen), not11(_Str_contains2(`${alias.name}.`, body))) ? nsTypeImportsFrom(stmts, body, seen, i + 1) : _Array_prepend11(`import type * as ${alias.name} from "${mochiDtsSpec(from)}";`, nsTypeImportsFrom(stmts, body, _Set_add7(alias.name, seen), i + 1))).with({ _tag: "Some" }, () => nsTypeImportsFrom(stmts, body, seen, i + 1)).exhaustive());
var emitDtsFromTyped = _curry18(5, (stmts, env, aliases, qualify, runtimeImport) => {
  const recs = recordAliasIndex(aliases);
  const local = declaredTypeNames(stmts, 0, _Set_fromArray7([]));
  const quals = writtenQualsFrom(stmts, local, qualify, 0);
  const types = typeDeclsFrom(stmts, aliases, recs, quals, 0);
  const bindings = bindingDeclsFrom(stmts, env, recs, quals, 0);
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray7([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray7([]));
  const core = _Str_join8(`
`, _Array_concat9(types, bindings));
  const builtinNames = builtinTypeNamesFor(declared, wanted, core, 0);
  const body = `${_Str_join8(`
`, _Array_concat9(builtinDeclsFor2(builtinNames, aliases, recs, 0), _Array_concat9(types, bindings)))}
`;
  const curry = _Str_contains2("_Curry<", body) ? [`import type { _Curry } from "${runtimeImport}";`] : [];
  const imports = _Array_concat9(curry, nsTypeImportsFrom(stmts, body, _Set_fromArray7([]), 0));
  return eq15(length13(imports), 0) ? body : `${_Str_join8(`
`, imports)}
${body}`;
});
var addQuals = _curry18(5, (alias, names, local, acc, i) => match16(_Array_get14(i, names)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: name }) => addQuals(alias, names, local, or9(_Set_has7(name, local), _Map_has5(name, acc)) ? acc : _Map_set10(name, `${alias}.${name}`, acc), i + 1)).exhaustive());
var qualsFromAliases = _curry18(5, (aliases, quals, local, acc, i) => match16(_Array_get14(i, aliases)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: alias }) => match16(_Map_get11(alias, quals)).with({ _tag: "None" }, () => qualsFromAliases(aliases, quals, local, acc, i + 1)).with({ _tag: "Some" }, ({ value: scope }) => qualsFromAliases(aliases, quals, local, addQuals(alias, _Set_toArray4(scope.types), local, acc, 0), i + 1)).exhaustive()).exhaustive());
var qualifierMapOf = _curry18(2, (quals, local) => qualsFromAliases(_Map_keys7(quals), quals, local, new Map, 0));
var emitDtsText = _curry18(2, (src, runtimeImport) => _Result_map6(([stmts, r]) => emitDtsFromTyped(stmts, r.env, r.aliases, new Map, runtimeImport), typedProgram(src)));

import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, relative, resolve as resolve2 } from "path";
var Ok11 = (value) => ({ _tag: "Ok", value });
var Err9 = (error) => ({ _tag: "Err", error });
var msg = (e) => String(e && e.message || e);
var readFile = (path) => {
  try {
    return Ok11(readFileSync(path, "utf8"));
  } catch (e) {
    return Err9(msg(e));
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

var emitDts = _curry19(2, (src, runtimeImport) => emitDtsText(src, runtimeImport));
var symbolOccurrences = (stmts) => index(stmts);
var addCtorOrigins = _curry19(3, (ctors, typeSpan, origins) => reduce5(_curry19(2, (acc, ctor) => _Map_set11(ctor.name, typeSpan, acc)), origins, ctors));
var exportedOriginsFrom = _curry19(3, (stmts, i, origins) => match17(_Array_get15(i, stmts)).with({ _tag: "None" }, () => origins).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet" && _g.value.exported === true;
}, ({ value: { name, nameSpan } }) => exportedOriginsFrom(stmts, i + 1, { values: _Map_set11(name, nameSpan, origins.values), types: origins.types, ctors: origins.ctors })).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SExtern" && _g.value.exported === true;
}, ({ value: { name, nameSpan } }) => exportedOriginsFrom(stmts, i + 1, { values: _Map_set11(name, nameSpan, origins.values), types: origins.types, ctors: origins.ctors })).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
}, ({ value: { name, ctors, span } }) => exportedOriginsFrom(stmts, i + 1, { values: origins.values, types: _Map_set11(name, span, origins.types), ctors: addCtorOrigins(ctors, span, origins.ctors) })).with({ _tag: "Some" }, () => exportedOriginsFrom(stmts, i + 1, origins)).exhaustive());
var exportedOrigins = (stmts) => exportedOriginsFrom(stmts, 0, { values: new Map, types: new Map, ctors: new Map });
var resolveImport2 = _curry19(2, resolveImport);
var mErr = (message) => ({ message, start: 0, end: 0 });
var recoveryScheme = { vars: [0], rvars: [], ty: tVar(0) };
var atPath = _curry19(2, (path, e) => ({ message: `module '${path}': ${e.message}`, start: e.start, end: e.end }));
var parseModule = ($x) => _Result_flatMap8(parse)(lex($x));
var importFromsFrom = _curry19(3, (stmts, i, acc) => match17(_Array_get15(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => match17(s).with({ _tag: "SImport" }, ({ from }) => importFromsFrom(stmts, i + 1, _Array_append14(from, acc))).with({ _tag: "SImportNs" }, ({ from }) => importFromsFrom(stmts, i + 1, _Array_append14(from, acc))).otherwise(() => importFromsFrom(stmts, i + 1, acc))).exhaustive());
var importFroms = (stmts) => importFromsFrom(stmts, 0, []);
var visit = _curry19(2, (path, acc) => match17(_Map_get12(path, acc.state)).with({ _tag: "Some", value: "done" }, () => Ok12(acc)).with({ _tag: "Some", value: "loading" }, () => Err10(mErr(`import cycle through '${path}'`))).otherwise(() => ((acc1) => match17(readFile(path)).with({ _tag: "Err" }, () => Err10(mErr(`cannot read module '${path}'`))).with({ _tag: "Ok" }, ({ value: src }) => match17(parseModule(src)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: stmts }) => match17(visitAll(importFroms(stmts), path, acc1)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: acc2 }) => Ok12({ state: _Map_set11(path, "done", acc2.state), order: _Array_append14({ path, stmts }, acc2.order) })).exhaustive()).exhaustive()).exhaustive())({ state: _Map_set11(path, "loading", acc.state), order: acc.order })));
var visitAll = _curry19(3, (froms, importer, acc) => match17(froms).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok12(acc)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([from, ...rest]) => match17(visit(resolveImport2(importer, from), acc)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: acc1 }) => visitAll(rest, importer, acc1)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var loadGraph = (entry) => _Result_flatMap8((acc) => Ok12(acc.order), visit(absPath(entry), { state: new Map, order: [] }));
var emptyReg = { ctors: new Map, types: new Map };
var mergeInto2 = _curry19(3, (keys, from, into) => match17(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => mergeInto2(rest, from, match17(_Map_get12(k, from)).with({ _tag: "Some" }, ({ value: v }) => _Map_set11(k, v, into)).with({ _tag: "None" }, () => into).exhaustive())).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeMap = _curry19(2, (from, into) => mergeInto2(_Map_keys8(from), from, into));
var exportedTypeNames = (stmts) => _Set_fromArray8(_Array_flatMap4((s) => match17(s).with({ _tag: "SType", exported: true }, ({ name }) => [name]).otherwise(() => []), stmts));
var aliasesOf = (stmts) => reduce5(_curry19(2, (acc, s) => match17(s).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.alias._tag === "Some";
}, ({ name, params, alias: { value: fields } }) => _Map_set11(name, { params, fields, expr: None17 }, acc)).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.aliasType._tag === "Some";
}, ({ name, params, aliasType: { value: te } }) => _Map_set11(name, { params, fields: [], expr: Some17(te) }, acc)).otherwise(() => acc)), new Map, stmts);
var qualScopeOf = (stmts) => ({ types: exportedTypeNames(stmts), aliases: aliasesOf(stmts) });
var withNamedCtor = _curry19(5, (name, info, depReg, depKeys, res) => ({ imports: res.imports, nsImports: res.nsImports, reg: { ctors: _Map_set11(name, info, res.reg.ctors), types: match17(_Map_get12(info.owner, depReg.types)).with({ _tag: "Some" }, ({ value: cs }) => _Map_set11(info.owner, cs, res.reg.types)).with({ _tag: "None" }, () => res.reg.types).exhaustive() }, keys: match17(_Map_get12(name, depKeys)).with({ _tag: "Some" }, ({ value: ks }) => _Map_set11(name, ks, res.keys)).with({ _tag: "None" }, () => res.keys).exhaustive(), quals: res.quals }));
var takeNamedCtor = _curry19(5, (name, span, depReg, depKeys, res) => match17(_Map_get12(name, depReg.ctors)).with({ _tag: "None" }, () => Ok12(res)).with({ _tag: "Some" }, ({ value: info }) => match17(_Map_get12(name, res.reg.ctors)).with({ _tag: "Some" }, ({ value: prior }) => not12(eq16(prior.owner, info.owner)) ? Err10({ message: `duplicate constructor '${name}'`, start: span.start, end: span.end }) : Ok12(withNamedCtor(name, info, depReg, depKeys, res))).with({ _tag: "None" }, () => Ok12(withNamedCtor(name, info, depReg, depKeys, res))).exhaustive()).exhaustive());
var prefixCtorsInto = _curry19(4, (keys, alias, from, into) => match17(keys).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => into).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([k, ...rest]) => prefixCtorsInto(rest, alias, from, match17(_Map_get12(k, from)).with({ _tag: "Some" }, ({ value: v }) => _Map_set11(`${alias}.${k}`, v, into)).with({ _tag: "None" }, () => into).exhaustive())).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var resolveNames = _curry19(7, (names, from, depExports, depReg, depKeys, res, recovering) => match17(names).with((_v) => _v.length === 0, () => Ok12(res)).with((_v) => _v.length >= 1, ([n, ...rest]) => match17(_Map_get12(n.name, depExports)).with({ _tag: "None" }, () => recovering ? resolveNames(rest, from, depExports, depReg, depKeys, { imports: _Map_set11(n.name, recoveryScheme, res.imports), nsImports: res.nsImports, reg: res.reg, keys: res.keys, quals: res.quals }, recovering) : Err10({ message: `'${from}' has no export '${n.name}'`, start: n.span.start, end: n.span.end })).with({ _tag: "Some" }, ({ value: sc }) => match17(takeNamedCtor(n.name, n.span, depReg, depKeys, { imports: _Map_set11(n.name, sc, res.imports), nsImports: res.nsImports, reg: res.reg, keys: res.keys, quals: res.quals })).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: res1 }) => resolveNames(rest, from, depExports, depReg, depKeys, res1, recovering)).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var resolveImportsFrom = _curry19(6, (ctx, stmts, i, path, res, recovering) => match17(_Array_get15(i, stmts)).with({ _tag: "None" }, () => Ok12(res)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SImport";
}, ({ value: { names, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => match17(resolveNames(names, from, depExports, depReg, depKeys, res, recovering)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: res1 }) => resolveImportsFrom(ctx, stmts, i + 1, path, res1, recovering)).exhaustive())(_Map_getOr8(new Map, dp, ctx.keysByPath)))(_Map_getOr8(emptyReg, dp, ctx.regByPath)))(_Map_getOr8(new Map, dp, ctx.exportsByPath)))(resolveImport2(path, from))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SImportNs";
}, ({ value: { alias, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => resolveImportsFrom(ctx, stmts, i + 1, path, { imports: res.imports, nsImports: _Map_set11(alias.name, depExports, res.nsImports), reg: { ctors: prefixCtorsInto(_Map_keys8(depReg.ctors), alias.name, depReg.ctors, res.reg.ctors), types: mergeMap(depReg.types, res.reg.types) }, keys: mergeMap(depKeys, res.keys), quals: match17(_Map_get12(dp, ctx.qualsByPath)).with({ _tag: "Some" }, ({ value: q }) => _Map_set11(alias.name, q, res.quals)).with({ _tag: "None" }, () => res.quals).exhaustive() }, recovering))(_Map_getOr8(new Map, dp, ctx.keysByPath)))(_Map_getOr8(emptyReg, dp, ctx.regByPath)))(_Map_getOr8(new Map, dp, ctx.exportsByPath)))(resolveImport2(path, from))).with({ _tag: "Some" }, () => resolveImportsFrom(ctx, stmts, i + 1, path, res, recovering)).exhaustive());
var compileOne = _curry19(3, (ctx, loaded, recovering) => match17(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, recovering)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: res }) => match17(checkWith(loaded.stmts, res.reg, res.quals)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, () => match17(inferProgramImports(loaded.stmts, builtins, namespaces, not12(recovering), res.imports, res.nsImports, res.quals, None17)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: env }) => ((js) => Ok12({ exportsByPath: _Map_set11(loaded.path, exportedSchemes(loaded.stmts, env), ctx.exportsByPath), regByPath: _Map_set11(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set11(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set11(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath), outputs: [...ctx.outputs, { path: loaded.path, js }] }))(codegen(loaded.stmts, res.keys, true, namespaceRuntime, preludeJsDefs, runtimeDeps))).exhaustive()).exhaustive()).exhaustive());
var compileAll = _curry19(2, (ctx, graph) => match17(graph).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok12(ctx.outputs)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([m, ...rest]) => match17(compileOne(ctx, m, false)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAll(ctx1, rest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var compileGraph = (graph) => compileAll({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, outputs: [] }, graph);
var compileAllRecovering = _curry19(3, (ctx, graph, errors) => match17(graph).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => ({ ctx, errors })).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([m, ...rest]) => match17(compileOne(ctx, m, true)).with({ _tag: "Err" }, ({ error: e }) => compileAllRecovering(ctx, rest, _Array_append14(e, errors))).with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAllRecovering(ctx1, rest, errors)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freshRecoveryGraphState = () => ({ ctx: { exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, outputs: [] }, errors: [] });
var recoverGraphFrom = _curry19(2, (state, graph) => compileAllRecovering(state.ctx, graph, state.errors));
var compileGraphRecovering = (graph) => {
  const state = recoverGraphFrom(freshRecoveryGraphState(), graph);
  return { outputs: state.ctx.outputs, errors: state.errors };
};
var inferOne = _curry19(2, (ctx, loaded) => match17(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: res }) => match17(checkWith(loaded.stmts, res.reg, res.quals)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, () => match17(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, true, res.imports, res.nsImports, res.quals, None17)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: r }) => Ok12({ exportsByPath: _Map_set11(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set11(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set11(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set11(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), outputs: [...ctx.outputs, { path: loaded.path, types: map14((hit) => ({ span: hit.span, ty: hit.ty, display: showType(widenLits(hit.ty)) }), r.types), aliases: mergeMap(r.aliases, ctx.aliases) }] })).exhaustive()).exhaustive()).exhaustive());
var inferAll = _curry19(2, (ctx, graph) => match17(graph).with((_v) => _v.length === 0, () => Ok12(ctx)).with((_v) => _v.length >= 1, ([m, ...rest]) => match17(inferOne(ctx, m)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: ctx1 }) => inferAll(ctx1, rest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freshInferGraphState = () => ({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, outputs: [] });
var inferGraphTypesFrom = _curry19(2, (state, graph) => inferAll(state, graph));
var inferGraphTypes = (graph) => _Result_flatMap8((state) => Ok12(state.outputs), inferGraphTypesFrom(freshInferGraphState(), graph));
var buildModules = (entry) => _Result_flatMap8((graph) => compileGraph(graph), loadGraph(entry));
var relSpec2 = _curry19(2, relSpec);
var externDtsPath2 = _curry19(2, externDtsPath);
var isIdentChar = (c) => match17(_Str_codeAt7(0, c)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: n }) => or10(or10(or10(or10(and11(n >= 48, n <= 57), and11(n >= 65, n <= 90)), and11(n >= 97, n <= 122)), eq16(n, 95)), eq16(n, 36))).exhaustive();
var endsAtBoundary = (part) => eq16(_Str_length5(part), 0) ? true : not12(isIdentChar(_Option_unwrapOr10("", _Str_get3(_Str_length5(part) - 1, part))));
var startsAtBoundary = (part) => eq16(_Str_length5(part), 0) ? true : not12(isIdentChar(_Option_unwrapOr10("", _Str_get3(0, part))));
var occursAsWordFrom = _curry19(2, (parts, i) => match17(_Array_get15(i, parts)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: after }) => and11(_Option_mapOr(false, endsAtBoundary, _Array_get15(i - 1, parts)), startsAtBoundary(after)) ? true : occursAsWordFrom(parts, i + 1)).exhaustive());
var occursAsWord = _curry19(2, (name, text) => occursAsWordFrom(_Str_split4(name, text), 1));
var importedBinding = (spec) => {
  const parts = _Str_split4(" as ", spec);
  return _Str_trim(_Option_unwrapOr10(spec, _Array_get15(length14(parts) - 1, parts)));
};
var bindingsInLine = _curry19(2, (line, acc) => match17(_Array_get15(1, _Str_split4("{", line))).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: rest }) => match17(_Array_get15(0, _Str_split4("}", rest))).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: names }) => reduce5(_curry19(2, (a, n) => _Set_add8(importedBinding(n), a)), acc, _Str_split4(",", names))).exhaustive()).exhaustive());
var valueImported = (ts) => reduce5(_curry19(2, (acc, line) => bindingsInLine(line, acc)), _Set_fromArray8([]), filter6(_Str_startsWith6("import {"), _Str_split4(`
`, ts)));
var ownTypesInto = _curry19(3, (stmts, path, acc) => reduce5(_curry19(2, (a, s) => match17(s).with({ _tag: "SType" }, ({ name }) => _Map_set11(name, path, a)).otherwise(() => a)), acc, stmts));
var typeOwnerOf = (graph) => reduce5(_curry19(2, (acc, m) => ownTypesInto(m.stmts, m.path, acc)), new Map, graph);
var localTypeNames = (stmts) => _Set_fromArray8(_Array_flatMap4((s) => match17(s).with({ _tag: "SType" }, ({ name }) => [name]).otherwise(() => []), stmts));
var groupByOwner = _curry19(2, (names, ctx) => reduce5(_curry19(2, (acc, name) => {
  const owner = _Map_getOr8("", name, ctx.typeOwner);
  return or10(or10(or10(eq16(owner, ctx.importer), _Set_has8(name, ctx.localTypes)), _Set_has8(name, ctx.bound)), not12(occursAsWord(name, ctx.ts))) ? acc : ((spec) => _Map_set11(spec, _Array_append14(name, _Map_getOr8([], spec, acc)), acc))(relSpec2(ctx.importer, owner));
}), new Map, names));
var crossModuleTypeImports = _curry19(4, (ts, importer, localTypes, typeOwner) => {
  const byOwner = groupByOwner(_Map_keys8(typeOwner), { ts, importer, localTypes, typeOwner, bound: valueImported(ts) });
  return map14((spec) => `import type { ${_Str_join9(", ", _Array_sort3(_Map_getOr8([], spec, byOwner)))} } from "${spec}";`, _Map_keys8(byOwner));
});
var externBindingsInto = _curry19(4, (stmts, path, env, acc) => reduce5(_curry19(2, (a, s) => match17(s).with({ _tag: "SExtern" }, ({ name, module: hostModule, imported, curried }) => _Str_startsWith6("mochi:", hostModule) ? a : match17(_Map_get12(name, env)).with({ _tag: "None" }, () => a).with({ _tag: "Some" }, ({ value: sc }) => ((dp) => _Map_set11(dp, _Array_append14({ imported, scheme: sc, curried }, _Map_getOr8([], dp, a)), a))(externDtsPath2(path, hostModule))).exhaustive()).otherwise(() => a)), acc, stmts));
var compileOneTs = _curry19(2, (ctx, loaded) => match17(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: res }) => match17(checkWith(loaded.stmts, res.reg, res.quals)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, () => match17(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, true, res.imports, res.nsImports, res.quals, None17)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: r }) => ((body) => ((lines) => ((ts) => Ok12({ exportsByPath: _Map_set11(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set11(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set11(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set11(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), typeOwner: ctx.typeOwner, runtimeImport: ctx.runtimeImport, externs: externBindingsInto(loaded.stmts, loaded.path, r.env, ctx.externs), outputs: [...ctx.outputs, { path: loaded.path, js: ts }] }))(eq16(length14(lines), 0) ? body : `${_Str_join9(`
`, lines)}

${body}`))(crossModuleTypeImports(body, loaded.path, localTypeNames(loaded.stmts), ctx.typeOwner)))(emitTsModule(loaded.stmts, r.env, r.types, r.letParams, mergeMap(r.aliases, ctx.aliases), res.keys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, ctx.runtimeImport))).exhaustive()).exhaustive()).exhaustive());
var noAliases = aliasesOf([]);
var externOutputs = (externs) => map14((dp) => ({ path: dp, js: externModuleDts(_Map_getOr8([], dp, externs), noAliases) }), _Map_keys8(externs));
var compileAllTs = _curry19(2, (ctx, graph) => match17(graph).with((_v) => _v.length === 0, () => Ok12(_Array_concat10(ctx.outputs, externOutputs(ctx.externs)))).with((_v) => _v.length >= 1, ([m, ...rest]) => match17(compileOneTs(ctx, m)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAllTs(ctx1, rest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var compileGraphTs = _curry19(2, (graph, runtimeImport) => compileAllTs({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, typeOwner: typeOwnerOf(graph), runtimeImport, externs: new Map, outputs: [] }, graph));
var dtsOne = _curry19(2, (ctx, loaded) => match17(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: res }) => match17(checkWith(loaded.stmts, res.reg, res.quals)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, () => match17(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, true, res.imports, res.nsImports, res.quals, None17)).with({ _tag: "Err" }, ({ error: e }) => Err10(atPath(loaded.path, e))).with({ _tag: "Ok" }, ({ value: r }) => Ok12({ exportsByPath: _Map_set11(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set11(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set11(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set11(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), runtimeImport: ctx.runtimeImport, target: ctx.target, dts: eq16(loaded.path, ctx.target) ? emitDtsFromTyped(loaded.stmts, r.env, mergeMap(r.aliases, ctx.aliases), qualifierMapOf(res.quals, localTypeNames(loaded.stmts)), ctx.runtimeImport) : ctx.dts })).exhaustive()).exhaustive()).exhaustive());
var dtsAll = _curry19(2, (ctx, graph) => match17(graph).with((_v) => _v.length === 0, () => Ok12(ctx.dts)).with((_v) => _v.length >= 1, ([m, ...rest]) => match17(dtsOne(ctx, m)).with({ _tag: "Err" }, ({ error: e }) => Err10(e)).with({ _tag: "Ok" }, ({ value: ctx1 }) => dtsAll(ctx1, rest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var emitDtsForFile = _curry19(2, (entry, runtimeImport) => _Result_flatMap8((graph) => dtsAll({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, runtimeImport, target: entry, dts: "" }, graph), loadGraph(entry)));
var buildModulesTs = _curry19(2, (entry, runtimeImport) => _Result_flatMap8((graph) => compileGraphTs(graph, runtimeImport), loadGraph(entry)));
export {
  buildModules,
  buildModulesTs,
  compileGraph,
  compileGraphRecovering,
  compileGraphTs,
  emitDts,
  emitDtsForFile,
  exportedOrigins,
  freshInferGraphState,
  freshRecoveryGraphState,
  inferGraphTypes,
  inferGraphTypesFrom,
  loadGraph,
  recoverGraphFrom,
  symbolOccurrences
};
