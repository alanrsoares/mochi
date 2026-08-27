import { match } from "@onrails/pattern";

const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const Some = (value) => ({ _tag: "Some", value });
const None = { _tag: "None" };
const Ok = (value) => ({ _tag: "Ok", value });
const Err = (error) => ({ _tag: "Err", error });
const add = _curry(2, (a, b) => a + b);
const sub = _curry(2, (a, b) => a - b);
const eq = _curry(2, (x, y) => {
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
});
const lt = _curry(2, (a, b) => a < b);
const gte = _curry(2, (a, b) => a >= b);
const lte = _curry(2, (a, b) => a <= b);
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const _Option_exists = _curry(2, (p, o) => o._tag === "Some" && p(o.value));
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);

import * as Ast from "../ast.js";
import { zonk, tPrim, tRecord, rExtend, TyFn, TyRecord, RowExtend, RowEmpty, RowVar } from "../types.js";
const TLet = { _tag: "TLet" };
const TType = { _tag: "TType" };
const TExtern = { _tag: "TExtern" };
const TSwitch = { _tag: "TSwitch" };
const TDo = { _tag: "TDo" };
const TLoop = { _tag: "TLoop" };
const TRecur = { _tag: "TRecur" };
const TImport = { _tag: "TImport" };
const TExport = { _tag: "TExport" };
const TEq = { _tag: "TEq" };
const TArrow = { _tag: "TArrow" };
const TTarrow = { _tag: "TTarrow" };
const TPipe = { _tag: "TPipe" };
const TCompose = { _tag: "TCompose" };
const TConcat = { _tag: "TConcat" };
const TBar = { _tag: "TBar" };
const TLparen = { _tag: "TLparen" };
const TRparen = { _tag: "TRparen" };
const TLbrace = { _tag: "TLbrace" };
const TRbrace = { _tag: "TRbrace" };
const TLbracket = { _tag: "TLbracket" };
const TRbracket = { _tag: "TRbracket" };
const TSpread = { _tag: "TSpread" };
const TPlus = { _tag: "TPlus" };
const TMinus = { _tag: "TMinus" };
const TStar = { _tag: "TStar" };
const TSlash = { _tag: "TSlash" };
const TPercent = { _tag: "TPercent" };
const TAt = { _tag: "TAt" };
const THash = { _tag: "THash" };
const TDot = { _tag: "TDot" };
const TColon = { _tag: "TColon" };
const TQuestion = { _tag: "TQuestion" };
const TEqeq = { _tag: "TEqeq" };
const TNeq = { _tag: "TNeq" };
const TLte = { _tag: "TLte" };
const TGte = { _tag: "TGte" };
const TLt = { _tag: "TLt" };
const TGt = { _tag: "TGt" };
const TAndand = { _tag: "TAndand" };
const TOror = { _tag: "TOror" };
const TBang = { _tag: "TBang" };
const TBacktick = { _tag: "TBacktick" };
const TComma = { _tag: "TComma" };
const TSemi = { _tag: "TSemi" };
const TNum = _curry(2, (value, raw) => ({ _tag: "TNum", value, raw }));
const TBool = (value) => ({ _tag: "TBool", value });
const TStr = (value) => ({ _tag: "TStr", value });
const TTmplStart = (value) => ({ _tag: "TTmplStart", value });
const TTmplMid = (value) => ({ _tag: "TTmplMid", value });
const TTmplEnd = (value) => ({ _tag: "TTmplEnd", value });
const TId = (value) => ({ _tag: "TId", value });
const TEof = { _tag: "TEof" };

const jxTokName = (t) => match(t)
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
const jxEofTok = { tok: TEof, start: 0, end: 0, doc: None };
const jxTokAt = _curry(2, (toks, i) => _Option_unwrapOr(jxEofTok)(_Array_get(i, toks)));
const jxSpanOf = (lt) => ({ start: lt.start, end: lt.end });
const jxSpanning = _curry(2, (a, b) => ({ start: a.start, end: b.end }));
const jxToEnd = _curry(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt(toks, sub(pos, 1)).end }));
const jxErrAt = _curry(2, (message, lt) => Err({ message: message, start: lt.start, end: lt.end }));
const jxExpectTok = _curry(3, (t, toks, pos) => { const lt = jxTokAt(toks, pos); return (eq(lt.tok, t) ? Ok(add(pos, 1)) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt)); });
const jxExpectId = _curry(2, (toks, pos) => { const lt = jxTokAt(toks, pos); return match(lt.tok)
  .with({ _tag: "TId" }, ({ value: name }) => Ok([{ name: name, span: jxSpanOf(lt) }, add(pos, 1)]))
  .otherwise((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt)); });
const jxKeywordText = (t) => match(t)
  .with({ _tag: "TLet" }, () => Some("let"))
  .with({ _tag: "TType" }, () => Some("type"))
  .with({ _tag: "TExtern" }, () => Some("extern"))
  .with({ _tag: "TSwitch" }, () => Some("switch"))
  .with({ _tag: "TLoop" }, () => Some("loop"))
  .with({ _tag: "TRecur" }, () => Some("recur"))
  .with({ _tag: "TDo" }, () => Some("do"))
  .with({ _tag: "TImport" }, () => Some("import"))
  .with({ _tag: "TExport" }, () => Some("export"))
  .otherwise(() => None);
const jxExpectLabel = _curry(2, (toks, pos) => { const lt = jxTokAt(toks, pos); return match(jxKeywordText(lt.tok))
  .with({ _tag: "Some" }, ({ value: name }) => Ok([{ name: name, span: jxSpanOf(lt) }, add(pos, 1)]))
  .with({ _tag: "None" }, () => jxExpectId(toks, pos))
  .exhaustive(); });
const jxIsUpper = (s) => _Option_exists((n) => and(gte(n, 65), lte(n, 90)))(_Str_codeAt(0, s));
const jxExprSpan = (e) => match(e)
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
const makeJsxCall = _curry(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => { const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos); const pragmaRef = Ast.ERef("h", jxSpanOf(startTok)); const propsRecord = Ast.ERecord(fields, spreadOpt, fullSpan); const childrenArr = Ast.EArr(children, fullSpan); return Ast.ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some("jsx"), fullSpan); });
const parseJsxAttributes = _curry(5, (toks, pos, fieldsAcc, spreadAcc, parseExpr) => { const tk = jxTokAt(toks, pos).tok; const nxt = jxTokAt(toks, add(pos, 1)).tok; return (or(eq(tk, TGt), and(eq(tk, TSlash), eq(nxt, TGt))) ? Ok([fieldsAcc, spreadAcc, pos]) : (eq(tk, TLbrace) ? _Result_flatMap((p1) => _Result_flatMap(([spExpr, p2]) => _Result_flatMap((p3) => parseJsxAttributes(toks, p3, fieldsAcc, Some(spExpr), parseExpr))(jxExpectTok(TRbrace, toks, p2)))(parseExpr(toks, p1)))(jxExpectTok(TSpread, toks, add(pos, 1))) : _Result_flatMap(([attrId, p1]) => (([valExpr, p2]) => { const field = { name: attrId.name, value: valExpr }; return parseJsxAttributes(toks, p2, _Array_append(field, fieldsAcc), spreadAcc, parseExpr); })((eq(jxTokAt(toks, p1).tok, TEq) ? ((pEq) => match(jxTokAt(toks, pEq).tok)
  .with({ _tag: "TStr" }, ({ value: v }) => [Ast.EStr(v, jxSpanOf(jxTokAt(toks, pEq))), add(pEq, 1)])
  .with({ _tag: "TLbrace" }, () => match(parseExpr(toks, add(pEq, 1)))
  .with((_v) => _v._tag === "Ok", ({ value: [e, pR] }) => [e, add(pR, 1)])
  .with({ _tag: "Err" }, () => [Ast.EBool(true, attrId.span), pEq])
  .exhaustive())
  .otherwise(() => [Ast.EBool(true, attrId.span), pEq]))(add(p1, 1)) : [Ast.EBool(true, attrId.span), p1])))(jxExpectLabel(toks, pos)))); });
const parseJsxChildren = _curry(5, (expectedTag, toks, pos, acc, parseExpr) => { const lt = jxTokAt(toks, pos); const nxt = jxTokAt(toks, add(pos, 1)); return (eq(lt.tok, TEof) ? jxErrAt((eq(expectedTag, "") ? "unclosed JSX fragment" : "unclosed JSX tag"), lt) : (and(eq(lt.tok, TLt), eq(nxt.tok, TSlash)) ? (eq(expectedTag, "") ? _Result_flatMap((p1) => Ok([acc, p1]))(jxExpectTok(TGt, toks, add(pos, 2))) : _Result_flatMap(([closingId, p1]) => _Result_flatMap((p2) => (eq(closingId.name, expectedTag) ? Ok([acc, p2]) : jxErrAt("mismatched JSX closing tag", lt)))(jxExpectTok(TGt, toks, p1)))(jxExpectId(toks, add(pos, 2)))) : (eq(lt.tok, TLt) ? _Result_flatMap(([childJsx, p1]) => parseJsxChildren(expectedTag, toks, p1, _Array_append(Ast.SEExpr(childJsx), acc), parseExpr))(parseJsx(toks, pos, parseExpr)) : (eq(lt.tok, TLbrace) ? (eq(nxt.tok, TSpread) ? _Result_flatMap(([spChild, p1]) => _Result_flatMap((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append(Ast.SESpread(spChild), acc), parseExpr))(jxExpectTok(TRbrace, toks, p1)))(parseExpr(toks, add(pos, 2))) : _Result_flatMap(([childExpr, p1]) => _Result_flatMap((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append(Ast.SEExpr(childExpr), acc), parseExpr))(jxExpectTok(TRbrace, toks, p1)))(parseExpr(toks, add(pos, 1)))) : match(lt.tok)
  .with({ _tag: "TStr" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, add(pos, 1), _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc), parseExpr))
  .with({ _tag: "TNum" }, ({ value: v, raw }) => parseJsxChildren(expectedTag, toks, add(pos, 1), _Array_append(Ast.SEExpr(Ast.ENum(v, raw, jxSpanOf(lt))), acc), parseExpr))
  .with({ _tag: "TBool" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, add(pos, 1), _Array_append(Ast.SEExpr(Ast.EBool(v, jxSpanOf(lt))), acc), parseExpr))
  .with({ _tag: "TId" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, add(pos, 1), _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc), parseExpr))
  .otherwise(() => jxErrAt("unexpected token in JSX children", lt)))))); });
const parseJsx = _curry(3, (toks, pos, parseExpr) => { const startTok = jxTokAt(toks, pos); const nxt = jxTokAt(toks, add(pos, 1)); return (eq(nxt.tok, TGt) ? _Result_flatMap(([children, p1]) => Ok([makeJsxCall(Ast.EStr("Fragment", jxSpanOf(startTok)), [], None, children, startTok, toks, p1), p1]))(parseJsxChildren("", toks, add(pos, 2), [], parseExpr)) : _Result_flatMap(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap(([fields, spreadOpt, p2]) => { const isSelfClosing = eq(jxTokAt(toks, p2).tok, TSlash); return _Result_flatMap((p3) => (isSelfClosing ? Ok([makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3]) : _Result_flatMap(([children, p4]) => Ok([makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4]))(parseJsxChildren(tagNameStr, toks, p3, [], parseExpr))))((isSelfClosing ? jxExpectTok(TGt, toks, add(p2, 1)) : jxExpectTok(TGt, toks, p2))); })(parseJsxAttributes(toks, p1, [], None, parseExpr)))(firstId.name))((jxIsUpper(firstId.name) ? Ast.ERef(firstId.name, firstId.span) : Ast.EStr(firstId.name, firstId.span))))(jxExpectId(toks, add(pos, 1)))); });
export const parseJsxAtom = _curry(3, (toks, pos, parseExpr) => (eq(jxTokAt(toks, pos).tok, TLt) ? _Result_map((claim) => Some(claim))(parseJsx(toks, pos, parseExpr)) : Ok(None)));
const seqElemExpr = (el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive();
const inferJsxArrElems = _curry(3, (elements, st, inferExpr) => match(elements)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([el, ...rest]) => _Result_flatMap(([_, st1]) => inferJsxArrElems(rest, st1, inferExpr))(inferExpr(seqElemExpr(el), st)))
  .exhaustive());
const inferJsxChildren = _curry(3, (children, st, inferExpr) => match(children)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1 && _v[0]._tag === "EArr", ([{ elements }, ...rest]) => _Result_flatMap((st1) => inferJsxChildren(rest, st1, inferExpr))(inferJsxArrElems(elements, st, inferExpr)))
  .with((_v) => _v.length >= 1, ([child, ...rest]) => _Result_flatMap(([_, st1]) => inferJsxChildren(rest, st1, inferExpr))(inferExpr(child, st)))
  .exhaustive());
const rowField = _curry(2, (row, label) => match(row)
  .with({ _tag: "RowExtend" }, ({ label: l, fieldType, rest }) => (eq(l, label) ? Some(fieldType) : rowField(rest, label)))
  .with({ _tag: "RowEmpty" }, () => None)
  .with({ _tag: "RowVar" }, () => None)
  .exhaustive());
const fieldNamed = _curry(2, (label, fields) => match(fields)
  .with((_v) => _v.length === 0, () => false)
  .with((_v) => _v.length >= 1, ([f, ...rest]) => or(eq(f.name, label), fieldNamed(label, rest)))
  .exhaustive());
const recordHasAttr = _curry(2, (expr, label) => match(expr)
  .with({ _tag: "ERecord" }, ({ fields }) => fieldNamed(label, fields))
  .otherwise(() => false));
const jsxChildCount = (restArgs) => match(restArgs)
  .with((_v) => _v.length >= 1 && _v[0]._tag === "EArr", ([{ elements }]) => length(elements))
  .otherwise(() => 0);
const jsxPropsWithSynthesizedChildren = _curry(4, (propsT, propsExpr, expectedRow, restArgs) => match(rowField(expectedRow, "children"))
  .with({ _tag: "None" }, () => propsT)
  .with({ _tag: "Some" }, ({ value: expectedChildren }) => match(propsT)
  .with({ _tag: "TyRecord" }, ({ row: prow }) => (or(recordHasAttr(propsExpr, "children"), eq(jsxChildCount(restArgs), 0)) ? propsT : tRecord(rExtend("children", expectedChildren, prow))))
  .otherwise(() => propsT))
  .exhaustive());
const inferJsxCall = _curry(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap(([tagT, st1]) => _Result_flatMap(([propsT, st2]) => _Result_flatMap((st3) => { const zonkedTag = zonk(tagT, st3); return match(zonkedTag)
  .with({ _tag: "TyFn" }, ({ from, to }) => match(from)
  .with({ _tag: "TyRecord" }, ({ row: expectedRow }) => ((propsForCheck) => _Result_map((st4) => [zonk(to, st4), st4])(api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr))))(jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs)))
  .otherwise(() => Ok([tPrim("VNode"), st3])))
  .otherwise(() => Ok([tPrim("VNode"), st3])); })(inferJsxChildren(restArgs, st2, api.inferExpr)))(api.inferExpr(propsExpr, st1)))(api.inferExpr(tagExpr, st)));
export const inferJsxCallHook = _curry(5, (_fn, args, origin, st, api) => match(origin)
  .with({ _tag: "Some" }, ({ value: o }) => (eq(o, "jsx") ? match(args)
  .with((_v) => _v.length >= 2, ([tagExpr, propsExpr, ...rest]) => _Result_map((r) => Some(r))(inferJsxCall(tagExpr, propsExpr, rest, st, api)))
  .otherwise(() => Ok(None)) : Ok(None)))
  .with({ _tag: "None" }, () => Ok(None))
  .exhaustive());
export const jsxPlugin = { name: "jsx", parse: Some(parseJsxAtom), inferCall: Some(inferJsxCallHook) };
