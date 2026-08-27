import { match } from "@onrails/pattern";

const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const _recur = (...args) => ({
  _tag: "recur",
  args
});
const _done = (value) => ({ _tag: "done", value });
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
const show = (x) => {
  const t = typeof x;
  if (t === "string")
    return JSON.stringify(x);
  if (t !== "object" || x === null)
    return String(x);
  if (Array.isArray(x))
    return `[${x.map(show).join(", ")}]`;
  if (x instanceof Map)
    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;
  if (x instanceof Set)
    return `#{${[...x].map(show).join(", ")}}`;
  if (typeof x[Symbol.iterator] === "function")
    return "<List>";
  if (typeof x._tag === "string") {
    const ks = Object.keys(x).filter((k) => k !== "_tag");
    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;
  }
  const ks = Object.keys(x);
  if (ks.length === 0)
    return String(x);
  return `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;
};
const lt = _curry(2, (a, b) => a < b);
const gt = _curry(2, (a, b) => a > b);
const gte = _curry(2, (a, b) => a >= b);
const lte = _curry(2, (a, b) => a <= b);
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const _Option_exists = _curry(2, (p, o) => o._tag === "Some" && p(o.value));
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);

const TLet = { _tag: "TLet" };
const TType = { _tag: "TType" };
const TExtern = { _tag: "TExtern" };
const TSwitch = { _tag: "TSwitch" };
const TLoop = { _tag: "TLoop" };
const TRecur = { _tag: "TRecur" };
const TDo = { _tag: "TDo" };
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
import * as Ast from "./ast.js";
import { parseHooksOf, resolvePluginsDefault, runParseHooks } from "./extensions.js";


const tokName = (t) => match(t)
  .with({ _tag: "TLet" }, () => "let")
  .with({ _tag: "TType" }, () => "type")
  .with({ _tag: "TExtern" }, () => "extern")
  .with({ _tag: "TSwitch" }, () => "switch")
  .with({ _tag: "TLoop" }, () => "loop")
  .with({ _tag: "TRecur" }, () => "recur")
  .with({ _tag: "TDo" }, () => "do")
  .with({ _tag: "TImport" }, () => "import")
  .with({ _tag: "TExport" }, () => "export")
  .with({ _tag: "TEq" }, () => "eq")
  .with({ _tag: "TArrow" }, () => "arrow")
  .with({ _tag: "TTarrow" }, () => "tarrow")
  .with({ _tag: "TPipe" }, () => "pipe")
  .with({ _tag: "TCompose" }, () => "compose")
  .with({ _tag: "TConcat" }, () => "concat")
  .with({ _tag: "TBar" }, () => "bar")
  .with({ _tag: "TLparen" }, () => "lparen")
  .with({ _tag: "TRparen" }, () => "rparen")
  .with({ _tag: "TLbrace" }, () => "lbrace")
  .with({ _tag: "TRbrace" }, () => "rbrace")
  .with({ _tag: "TLbracket" }, () => "lbracket")
  .with({ _tag: "TRbracket" }, () => "rbracket")
  .with({ _tag: "TSpread" }, () => "spread")
  .with({ _tag: "TPlus" }, () => "plus")
  .with({ _tag: "TMinus" }, () => "minus")
  .with({ _tag: "TStar" }, () => "star")
  .with({ _tag: "TSlash" }, () => "slash")
  .with({ _tag: "TPercent" }, () => "percent")
  .with({ _tag: "TAt" }, () => "at")
  .with({ _tag: "THash" }, () => "hash")
  .with({ _tag: "TDot" }, () => "dot")
  .with({ _tag: "TColon" }, () => "colon")
  .with({ _tag: "TQuestion" }, () => "question")
  .with({ _tag: "TEqeq" }, () => "eqeq")
  .with({ _tag: "TNeq" }, () => "neq")
  .with({ _tag: "TLte" }, () => "lte")
  .with({ _tag: "TGte" }, () => "gte")
  .with({ _tag: "TLt" }, () => "lt")
  .with({ _tag: "TGt" }, () => "gt")
  .with({ _tag: "TAndand" }, () => "andand")
  .with({ _tag: "TOror" }, () => "oror")
  .with({ _tag: "TBang" }, () => "bang")
  .with({ _tag: "TBacktick" }, () => "backtick")
  .with({ _tag: "TComma" }, () => "comma")
  .with({ _tag: "TSemi" }, () => "semi")
  .with({ _tag: "TNum" }, () => "num")
  .with({ _tag: "TBool" }, () => "bool")
  .with({ _tag: "TStr" }, () => "str")
  .with({ _tag: "TTmplStart" }, () => "tmplstart")
  .with({ _tag: "TTmplMid" }, () => "tmplmid")
  .with({ _tag: "TTmplEnd" }, () => "tmplend")
  .with({ _tag: "TId" }, () => "id")
  .with({ _tag: "TEof" }, () => "eof")
  .exhaustive();
const eofTok = { tok: TEof, start: 0, end: 0, doc: None };
const tokAt = _curry(2, (toks, i) => _Option_unwrapOr(eofTok)(_Array_get(i, toks)));
const spanOf = (lt) => ({ start: lt.start, end: lt.end });
const spanning = _curry(2, (a, b) => ({ start: a.start, end: b.end }));
const toEnd = _curry(3, (start, toks, pos) => ({ start: start.start, end: tokAt(toks, sub(pos, 1)).end }));
const errAt = _curry(2, (message, lt) => Err({ message: message, start: lt.start, end: lt.end }));
const expectTok = _curry(3, (t, toks, pos) => { const lt = tokAt(toks, pos); return (eq(lt.tok, t) ? Ok(add(pos, 1)) : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt)); });
const expectId = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); return match(lt.tok)
  .with({ _tag: "TId" }, ({ value: name }) => Ok([{ name: name, span: spanOf(lt) }, add(pos, 1)]))
  .otherwise((t) => errAt(`expected id, got ${tokName(t)}`, lt)); });
const keywordText = (t) => match(t)
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
const expectLabel = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); return match(keywordText(lt.tok))
  .with({ _tag: "Some" }, ({ value: name }) => Ok([{ name: name, span: spanOf(lt) }, add(pos, 1)]))
  .with({ _tag: "None" }, () => expectId(toks, pos))
  .exhaustive(); });
const expectStr = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); return match(lt.tok)
  .with({ _tag: "TStr" }, ({ value }) => Ok([value, add(pos, 1)]))
  .otherwise((t) => errAt(`expected str, got ${tokName(t)}`, lt)); });
const expectIn = _curry(2, (toks, pos) => _Result_flatMap(([kw, p]) => (eq(kw.name, "in") ? Ok(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p))))(expectId(toks, pos)));
const isUpper = (s) => _Option_exists((n) => and(gte(n, 65), lte(n, 90)))(_Str_codeAt(0, s));
const sepBy = _curry(4, (parseItem, toks, pos, acc) => _Result_flatMap(([item, p]) => { const items = _Array_append(item, acc); return (eq(tokAt(toks, p).tok, TComma) ? sepBy(parseItem, toks, add(p, 1), items) : Ok([items, p])); })(parseItem(toks, pos)));
const sepByH = _curry(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap(([item, p]) => { const items = _Array_append(item, acc); return (eq(tokAt(toks, p).tok, TComma) ? sepByH(parseItem, toks, add(p, 1), items, hooks) : Ok([items, p])); })(parseItem(toks, pos, hooks)));
const listUntil = _curry(4, (close, parseItem, toks, pos) => (eq(tokAt(toks, pos).tok, close) ? Ok([[], pos]) : sepBy(parseItem, toks, pos, [])));
const listUntilH = _curry(5, (close, parseItem, toks, pos, hooks) => (eq(tokAt(toks, pos).tok, close) ? Ok([[], pos]) : sepByH(parseItem, toks, pos, [], hooks)));
const scanLambdaDepth = _curry(3, (toks, k, depth) => match(tokAt(toks, k).tok)
  .with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, add(k, 1), add(depth, 1)))
  .with({ _tag: "TRparen" }, () => (eq(depth, 1) ? eq(tokAt(toks, add(k, 1)).tok, TArrow) : scanLambdaDepth(toks, add(k, 1), sub(depth, 1))))
  .with({ _tag: "TEof" }, () => false)
  .otherwise(() => scanLambdaDepth(toks, add(k, 1), depth)));
const looksLikeLambda = _curry(2, (toks, pos) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TId" }, () => eq(tokAt(toks, add(pos, 1)).tok, TArrow))
  .with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, pos, 0))
  .otherwise(() => false));
const exprSpan = (e) => match(e)
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
const tySpan = (t) => match(t)
  .with({ _tag: "TyName" }, ({ span: sp }) => sp)
  .with({ _tag: "TyArrow" }, ({ span: sp }) => sp)
  .with({ _tag: "TyApp" }, ({ span: sp }) => sp)
  .with({ _tag: "TyTuple" }, ({ span: sp }) => sp)
  .with({ _tag: "TyList" }, ({ span: sp }) => sp)
  .with({ _tag: "TyQual" }, ({ span: sp }) => sp)
  .with({ _tag: "TyLit" }, ({ span: sp }) => sp)
  .with({ _tag: "TyUnion" }, ({ span: sp }) => sp)
  .exhaustive();
const parseParam = _curry(2, (toks, pos) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TLbrace" }, () => _Result_flatMap(([fields, p]) => _Result_flatMap((p2) => Ok([Ast.LPRecord(map((f) => f.name)(fields)), p2]))(expectTok(TRbrace, toks, p)))(listUntil(TRbrace, expectId, toks, add(pos, 1))))
  .with({ _tag: "TLparen" }, () => _Result_flatMap(([names, p]) => _Result_flatMap((p2) => Ok(match(names)
  .with((_v) => _v.length === 1, ([single]) => [Ast.LPName(single.name, None), p2])
  .otherwise((many) => [Ast.LPTuple(map((n) => n.name)(many)), p2])))(expectTok(TRparen, toks, p)))(sepBy(expectId, toks, add(pos, 1), [])))
  .otherwise(() => _Result_flatMap(([nm, p]) => (eq(tokAt(toks, p).tok, TColon) ? _Result_map(([annot, p2]) => [Ast.LPName(nm.name, Some(annot)), p2])(parseTypeExpr(toks, add(p, 1))) : Ok([Ast.LPName(nm.name, None), p])))(expectId(toks, pos))));
const parseLambda = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return match(tokAt(toks, pos).tok)
  .with({ _tag: "TId" }, ({ value: name }) => _Result_flatMap((p) => _Result_flatMap(([body, p2]) => Ok([Ast.ELambda([Ast.LPName(name, None)], body, spanning(start, exprSpan(body))), p2]))(parseLambdaBody(toks, p, hooks)))(expectTok(TArrow, toks, add(pos, 1))))
  .otherwise(() => _Result_flatMap((p) => _Result_flatMap(([params, p2]) => _Result_flatMap((p3) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => Ok([Ast.ELambda(params, body, spanning(start, exprSpan(body))), p5]))(parseLambdaBody(toks, p4, hooks)))(expectTok(TArrow, toks, p3)))(expectTok(TRparen, toks, p2)))(listUntil(TRparen, parseParam, toks, p)))(expectTok(TLparen, toks, pos))); });
const parseLambdaBody = _curry(3, (toks, pos, hooks) => (and(eq(tokAt(toks, pos).tok, TLbrace), arrowBodyIsDoBlock(toks, pos, 0)) ? parseDoBlock(toks, pos, hooks) : parseExpr(toks, pos, hooks)));
const arrowBodyIsDoBlock = _curry(3, (toks, pos, depth) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TLbrace" }, () => arrowBodyIsDoBlock(toks, add(pos, 1), add(depth, 1)))
  .with({ _tag: "TRbrace" }, () => (eq(depth, 1) ? false : arrowBodyIsDoBlock(toks, add(pos, 1), sub(depth, 1))))
  .with({ _tag: "TSemi" }, () => or(eq(depth, 1), arrowBodyIsDoBlock(toks, add(pos, 1), depth)))
  .with({ _tag: "TEof" }, () => false)
  .otherwise(() => arrowBodyIsDoBlock(toks, add(pos, 1), depth)));
const parseLetIn = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (or(eq(tokAt(toks, p).tok, TQuestion), eq(tokAt(toks, p).tok, TBang)) ? ((monad) => ((paramSpan) => _Result_flatMap(([param, p1]) => _Result_flatMap((p2) => _Result_flatMap(([value, p3]) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => Ok([Ast.ELetBind(param, paramSpan, monad, value, body, spanning(start, exprSpan(body))), p5]))(parseExpr(toks, p4, hooks)))(expectIn(toks, p3)))(parseExpr(toks, p2, hooks)))(expectTok(TEq, toks, p1)))(parseParam(toks, add(p, 1))))(spanOf(tokAt(toks, add(p, 1)))))((eq(tokAt(toks, p).tok, TQuestion) ? "Result" : "Task")) : (eq(tokAt(toks, p).tok, TLparen) ? ((paramStart) => _Result_flatMap(([param, p1]) => _Result_flatMap((p2) => _Result_flatMap(([value, p3]) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => ((fn) => Ok([Ast.ECall(fn, [value], None, spanning(start, exprSpan(body))), p5]))(Ast.ELambda([param], body, spanning(paramStart, exprSpan(body)))))(parseExpr(toks, p4, hooks)))(expectIn(toks, p3)))(parseExpr(toks, p2, hooks)))(expectTok(TEq, toks, p1)))(parseParam(toks, p)))(spanOf(tokAt(toks, p))) : _Result_flatMap(([nm, p1]) => _Result_flatMap((p2) => _Result_flatMap(([value, p3]) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => Ok([Ast.ELetIn(nm.name, nm.span, value, body, spanning(start, exprSpan(body))), p5]))(parseExpr(toks, p4, hooks)))(expectIn(toks, p3)))(parseExpr(toks, p2, hooks)))(expectTok(TEq, toks, p1)))(expectId(toks, p)))))(expectTok(TLet, toks, pos)); });
const PIPE_BP = 5;
const COMPOSE_BP = 6;
const OR_BP = 7;
const AND_BP = 7;
const CMP_BP = 8;
const CONCAT_BP = 10;
const ADD_BP = 10;
const BACKTICK_BP = 15;
const MUL_BP = 20;
const FAST_PIPE_BP = 21;
const mkBinCall = _curry(4, (fnName, opSpan, left, right) => Ast.ECall(Ast.ERef(fnName, opSpan), [left, right], None, spanning(exprSpan(left), exprSpan(right))));
const opFnName = (t) => match(t)
  .with({ _tag: "TPlus" }, () => "add")
  .with({ _tag: "TMinus" }, () => "sub")
  .with({ _tag: "TStar" }, () => "mul")
  .with({ _tag: "TSlash" }, () => "div")
  .with({ _tag: "TPercent" }, () => "mod")
  .with({ _tag: "TAndand" }, () => "and")
  .with({ _tag: "TOror" }, () => "or")
  .with({ _tag: "TConcat" }, () => "concat")
  .with({ _tag: "TEqeq" }, () => "eq")
  .with({ _tag: "TLt" }, () => "lt")
  .with({ _tag: "TLte" }, () => "lte")
  .with({ _tag: "TGt" }, () => "gt")
  .with({ _tag: "TGte" }, () => "gte")
  .otherwise(() => "eq");
const isSectionOp = (t) => match(t)
  .with({ _tag: "TPlus" }, () => true)
  .with({ _tag: "TMinus" }, () => true)
  .with({ _tag: "TStar" }, () => true)
  .with({ _tag: "TSlash" }, () => true)
  .with({ _tag: "TPercent" }, () => true)
  .with({ _tag: "TAndand" }, () => true)
  .with({ _tag: "TOror" }, () => true)
  .with({ _tag: "TConcat" }, () => true)
  .with({ _tag: "TEqeq" }, () => true)
  .with({ _tag: "TNeq" }, () => true)
  .with({ _tag: "TLt" }, () => true)
  .with({ _tag: "TLte" }, () => true)
  .with({ _tag: "TGt" }, () => true)
  .with({ _tag: "TGte" }, () => true)
  .otherwise(() => false);
const sectionBody = _curry(4, (opTok, x, y, opSpan) => { const full = spanning(exprSpan(x), exprSpan(y)); return (eq(opTok, TNeq) ? Ast.ECall(Ast.ERef("not", opSpan), [mkBinCall("eq", opSpan, x, y)], None, full) : mkBinCall(opFnName(opTok), opSpan, x, y)); });
const sectionLeft = _curry(2, (provided, opLt) => { const opSpan = spanOf(opLt); const paramRef = Ast.ERef("$s", opSpan); return Ast.ELambda([Ast.LPName("$s", None)], sectionBody(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan)); });
const parseRightSection = _curry(4, (toks, lparenSpan, pos, hooks) => { const lt = tokAt(toks, pos); return _Result_flatMap(([y, p1]) => _Result_flatMap((p2) => ((paramRef) => Ok([Ast.ELambda([Ast.LPName("$s", None)], sectionBody(lt.tok, paramRef, y, spanOf(lt)), toEnd(lparenSpan, toks, p2)), p2]))(Ast.ERef("$s", spanOf(lt))))(expectTok(TRparen, toks, p1)))(parseExpr(toks, add(pos, 1), hooks)); });
const binCallOrLeftSection = _curry(7, (toks, left, lt, pos, bp, fnName, hooks) => (eq(tokAt(toks, add(pos, 1)).tok, TRparen) ? Ok({ left: sectionLeft(left, lt), p: add(pos, 1), matched: true }) : _Result_flatMap(([right, p]) => Ok({ left: mkBinCall(fnName, spanOf(lt), left, right), p: p, matched: true }))(parseExprBp(toks, add(bp, 1), add(pos, 1), hooks))));
const isCmpTok = (t) => match(t)
  .with({ _tag: "TEqeq" }, () => true)
  .with({ _tag: "TNeq" }, () => true)
  .with({ _tag: "TLt" }, () => true)
  .with({ _tag: "TLte" }, () => true)
  .with({ _tag: "TGt" }, () => true)
  .with({ _tag: "TGte" }, () => true)
  .otherwise(() => false);
const cmpFnName = (t) => match(t)
  .with({ _tag: "TLt" }, () => "lt")
  .with({ _tag: "TLte" }, () => "lte")
  .with({ _tag: "TGt" }, () => "gt")
  .with({ _tag: "TGte" }, () => "gte")
  .otherwise(() => "eq");
const parseInfix = _curry(5, (toks, minBp, left, pos, hooks) => { const lt = tokAt(toks, pos); return (and(eq(lt.tok, TPipe), gte(PIPE_BP, minBp)) ? _Result_flatMap(([right, p]) => Ok({ left: Ast.EPipe(left, right, spanning(exprSpan(left), exprSpan(right))), p: p, matched: true }))(parseAtomOrCall(toks, add(pos, 1), hooks)) : (and(eq(lt.tok, TTarrow), gte(FAST_PIPE_BP, minBp)) ? _Result_flatMap(([right, p]) => match(right)
  .with({ _tag: "ECall" }, ({ fn, args, origin, span: rightSpan }) => Ok({ left: Ast.ECall(fn, _Array_prepend(left, args), origin, spanning(exprSpan(left), rightSpan)), p: p, matched: true }))
  .otherwise(() => errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt)))(parseAtomOrCall(toks, add(pos, 1), hooks)) : (and(eq(lt.tok, TCompose), gte(COMPOSE_BP, minBp)) ? _Result_flatMap(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok({ left: fn, p: p, matched: true }))(Ast.ELambda([Ast.LPName("$x", None)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(Ast.ECall(right, [innerCall], None, spanning(exprSpan(left), exprSpan(right)))))(Ast.ECall(left, [xRef], None, exprSpan(left))))(Ast.ERef("$x", opSpan)))(spanOf(lt)))(parseExprBp(toks, add(COMPOSE_BP, 1), add(pos, 1), hooks)) : (and(isCmpTok(lt.tok), gte(CMP_BP, minBp)) ? (eq(tokAt(toks, add(pos, 1)).tok, TRparen) ? Ok({ left: sectionLeft(left, lt), p: add(pos, 1), matched: true }) : _Result_flatMap(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok({ left: result, p: p, matched: true }))((eq(lt.tok, TNeq) ? Ast.ECall(Ast.ERef("not", opSpan), [inner], None, spanning(exprSpan(left), exprSpan(right))) : inner)))(mkBinCall(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)))(parseExprBp(toks, add(CMP_BP, 1), add(pos, 1), hooks))) : (and(or(eq(lt.tok, TAndand), eq(lt.tok, TOror)), gte((eq(lt.tok, TAndand) ? AND_BP : OR_BP), minBp)) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt, pos, bp, fnName, hooks))((eq(lt.tok, TAndand) ? "and" : "or")))((eq(lt.tok, TAndand) ? AND_BP : OR_BP)) : (and(eq(lt.tok, TConcat), gte(CONCAT_BP, minBp)) ? binCallOrLeftSection(toks, left, lt, pos, CONCAT_BP, "concat", hooks) : (and(eq(lt.tok, TBacktick), gte(BACKTICK_BP, minBp)) ? _Result_flatMap(([fnExpr, p1]) => _Result_flatMap((p2) => _Result_flatMap(([right, p3]) => Ok({ left: Ast.ECall(fnExpr, [left, right], None, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }))(parseExprBp(toks, add(BACKTICK_BP, 1), p2, hooks)))(expectTok(TBacktick, toks, p1)))(parseAtomOrCall(toks, add(pos, 1), hooks)) : (and(or(eq(lt.tok, TPlus), eq(lt.tok, TMinus)), gte(ADD_BP, minBp)) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, ADD_BP, fnName, hooks))((eq(lt.tok, TPlus) ? "add" : "sub")) : (and(or(eq(lt.tok, TStar), or(eq(lt.tok, TSlash), eq(lt.tok, TPercent))), gte(MUL_BP, minBp)) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, MUL_BP, fnName, hooks))((eq(lt.tok, TStar) ? "mul" : (eq(lt.tok, TSlash) ? "div" : "mod"))) : Ok({ left: left, p: pos, matched: false })))))))))); });
const infixLoop = _curry(5, (toks, minBp, left, pos, hooks) => _Result_flatMap((res) => (res.matched ? infixLoop(toks, minBp, res.left, res.p, hooks) : Ok([res.left, res.p])))(parseInfix(toks, minBp, left, pos, hooks)));
const ternaryTail = _curry(4, (toks, cond, pos, hooks) => (eq(tokAt(toks, pos).tok, TQuestion) ? _Result_flatMap(([thenE, p1]) => _Result_flatMap((p2) => _Result_flatMap(([elseE, p3]) => Ok([Ast.ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3]))(parseExpr(toks, p2, hooks)))(expectTok(TColon, toks, p1)))(parseExpr(toks, add(pos, 1), hooks)) : Ok([cond, pos])));
const parseExprBp = _curry(4, (toks, minBp, pos, hooks) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TLet" }, () => parseLetIn(toks, pos, hooks))
  .otherwise(() => (and(eq(minBp, 0), looksLikeLambda(toks, pos)) ? parseLambda(toks, pos, hooks) : _Result_flatMap(([left, p]) => _Result_flatMap(([left2, p2]) => (eq(minBp, 0) ? ternaryTail(toks, left2, p2, hooks) : Ok([left2, p2])))(infixLoop(toks, minBp, left, p, hooks)))(parseAtomOrCall(toks, pos, hooks)))));
const parseExpr = _curry(3, (toks, pos, hooks) => parseExprBp(toks, 0, pos, hooks));
const postfixLoop = _curry(4, (toks, e, pos, hooks) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TLparen" }, () => _Result_flatMap(([args, p]) => _Result_flatMap((p2) => postfixLoop(toks, Ast.ECall(e, args, None, toEnd(exprSpan(e), toks, p2)), p2, hooks))(expectTok(TRparen, toks, p)))(listUntilH(TRparen, parseExpr, toks, add(pos, 1), hooks)))
  .with({ _tag: "TDot" }, () => _Result_flatMap(([id, p]) => postfixLoop(toks, Ast.EField(e, id.name, spanning(exprSpan(e), id.span)), p, hooks))(expectLabel(toks, add(pos, 1))))
  .otherwise(() => Ok([e, pos])));
const parseAtomOrCall = _curry(3, (toks, pos, hooks) => { const lt = tokAt(toks, pos); return (or(eq(lt.tok, TMinus), eq(lt.tok, TBang)) ? _Result_flatMap(([operand, p]) => ((fnName) => Ok([Ast.ECall(Ast.ERef(fnName, spanOf(lt)), [operand], None, spanning(spanOf(lt), exprSpan(operand))), p]))((eq(lt.tok, TMinus) ? "negate" : "not")))(parseAtomOrCall(toks, add(pos, 1), hooks)) : _Result_flatMap(([e, p]) => postfixLoop(toks, e, p, hooks))(parseAtom(toks, pos, hooks))); });
const parseAtom = _curry(3, (toks, pos, hooks) => { const lt = tokAt(toks, pos); const sp = spanOf(lt); return match(lt.tok)
  .with({ _tag: "TSwitch" }, () => parseMatch(toks, pos, hooks))
  .with({ _tag: "TDo" }, () => parseDo(toks, pos, hooks))
  .with({ _tag: "TLoop" }, () => parseLoop(toks, pos, hooks))
  .with({ _tag: "TRecur" }, () => parseRecur(toks, pos, hooks))
  .with({ _tag: "TLbrace" }, () => parseRecord(toks, pos, hooks))
  .with({ _tag: "TLbracket" }, () => parseArr(toks, pos, hooks))
  .with({ _tag: "TAt" }, () => parseList(toks, pos, hooks))
  .with({ _tag: "THash" }, () => parseHash(toks, pos, hooks))
  .with({ _tag: "TTmplStart" }, () => parseInterp(toks, pos, hooks))
  .otherwise(() => _Result_flatMap((claimed) => match(claimed)
  .with((_v) => _v._tag === "Some", ({ value: [e, p] }) => Ok([e, p]))
  .with({ _tag: "None" }, () => match(lt.tok)
  .with({ _tag: "TNum" }, ({ value, raw }) => Ok([Ast.ENum(value, raw, sp), add(pos, 1)]))
  .with({ _tag: "TBool" }, ({ value }) => Ok([Ast.EBool(value, sp), add(pos, 1)]))
  .with({ _tag: "TStr" }, ({ value }) => Ok([Ast.EStr(value, sp), add(pos, 1)]))
  .with({ _tag: "TId" }, ({ value: name }) => Ok([Ast.ERef(name, sp), add(pos, 1)]))
  .with({ _tag: "TLparen" }, () => ((nxt) => (eq(nxt.tok, TRparen) ? Ok([Ast.EUnit(toEnd(sp, toks, add(pos, 2))), add(pos, 2)]) : (and(isSectionOp(nxt.tok), not(eq(nxt.tok, TMinus))) ? parseRightSection(toks, sp, add(pos, 1), hooks) : _Result_flatMap(([first, p]) => (eq(tokAt(toks, p).tok, TComma) ? _Result_flatMap(([elements, p2]) => _Result_flatMap((p3) => Ok([Ast.ETuple(elements, toEnd(sp, toks, p3)), p3]))(expectTok(TRparen, toks, p2)))(sepByH(parseExpr, toks, add(p, 1), [first], hooks)) : _Result_map((p2) => [first, p2])(expectTok(TRparen, toks, p))))(parseExpr(toks, add(pos, 1), hooks)))))(tokAt(toks, add(pos, 1))))
  .otherwise((t) => errAt(`unexpected token ${tokName(t)}`, lt)))
  .exhaustive())(runParseHooks(hooks, toks, pos, _curry(2, (t, p) => parseExpr(t, p, hooks))))); });
const parseInterpLoop = _curry(5, (toks, pos, start, acc, hooks) => _Result_flatMap(([holeExpr, p]) => ((acc2) => ((lt) => match(lt.tok)
  .with({ _tag: "TTmplMid" }, ({ value }) => parseInterpLoop(toks, add(p, 1), start, _Array_append(Ast.IPLit(value), acc2), hooks))
  .with({ _tag: "TTmplEnd" }, ({ value }) => Ok([Ast.EInterp(_Array_append(Ast.IPLit(value), acc2), toEnd(start, toks, add(p, 1))), add(p, 1)]))
  .otherwise((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt)))(tokAt(toks, p)))(_Array_append(Ast.IPExpr(holeExpr), acc)))(parseExpr(toks, pos, hooks)));
const parseInterp = _curry(3, (toks, pos, hooks) => { const lt = tokAt(toks, pos); return match(lt.tok)
  .with({ _tag: "TTmplStart" }, ({ value }) => parseInterpLoop(toks, add(pos, 1), spanOf(lt), [Ast.IPLit(value)], hooks))
  .otherwise((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt)); });
const parseField = _curry(3, (toks, pos, hooks) => { const lt = tokAt(toks, pos); return _Result_flatMap(([nm, p]) => (eq(tokAt(toks, p).tok, TColon) ? _Result_flatMap(([value, p2]) => Ok([{ name: nm.name, value: value }, p2]))(parseExpr(toks, add(p, 1), hooks)) : (not(eq(keywordText(lt.tok), None)) ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <expr>'`, lt) : Ok([{ name: nm.name, value: Ast.ERef(nm.name, nm.span) }, p]))))(expectLabel(toks, pos)); });
const parseRecord = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (eq(tokAt(toks, p).tok, TSpread) ? _Result_flatMap(([spreadExpr, p1]) => _Result_flatMap((p2) => _Result_flatMap(([fields, p3]) => _Result_flatMap((p4) => Ok([Ast.ERecord(fields, Some(spreadExpr), toEnd(start, toks, p4)), p4]))(expectTok(TRbrace, toks, p3)))(listUntilH(TRbrace, parseField, toks, p2, hooks)))((eq(tokAt(toks, p1).tok, TRbrace) ? Ok(p1) : expectTok(TComma, toks, p1))))(parseExpr(toks, add(p, 1), hooks)) : _Result_flatMap(([fields, p1]) => _Result_flatMap((p2) => Ok([Ast.ERecord(fields, None, toEnd(start, toks, p2)), p2]))(expectTok(TRbrace, toks, p1)))(listUntilH(TRbrace, parseField, toks, p, hooks))))(expectTok(TLbrace, toks, pos)); });
const parseSeqElem = _curry(3, (toks, pos, hooks) => (eq(tokAt(toks, pos).tok, TSpread) ? _Result_flatMap(([ex, p]) => Ok([Ast.SESpread(ex), p]))(parseExpr(toks, add(pos, 1), hooks)) : _Result_flatMap(([ex, p]) => Ok([Ast.SEExpr(ex), p]))(parseExpr(toks, pos, hooks))));
const parseArr = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap(([elements, p2]) => _Result_flatMap((p3) => Ok([Ast.EArr(elements, toEnd(start, toks, p3)), p3]))(expectTok(TRbracket, toks, p2)))(listUntilH(TRbracket, parseSeqElem, toks, p, hooks)))(expectTok(TLbracket, toks, pos)); });
const parseList = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap((p1) => _Result_flatMap(([elements, p2]) => _Result_flatMap((p3) => Ok([Ast.EList(elements, toEnd(start, toks, p3)), p3]))(expectTok(TRbrace, toks, p2)))(listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)))(expectTok(TLbrace, toks, p)))(expectTok(TAt, toks, pos)); });
const parseMapEntry = _curry(3, (toks, pos, hooks) => _Result_flatMap(([key, p]) => _Result_flatMap((p2) => _Result_flatMap(([value, p3]) => Ok([{ key: key, value: value }, p3]))(parseExpr(toks, p2, hooks)))(expectTok(TColon, toks, p)))(parseExpr(toks, pos, hooks)));
const parseHash = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap((p1) => (eq(tokAt(toks, p1).tok, TRbrace) ? _Result_flatMap((p2) => Ok([Ast.EMap([], toEnd(start, toks, p2)), p2]))(expectTok(TRbrace, toks, p1)) : (eq(tokAt(toks, p1).tok, TSpread) ? _Result_flatMap(([elements, p2]) => _Result_flatMap((p3) => Ok([Ast.ESet(elements, toEnd(start, toks, p3)), p3]))(expectTok(TRbrace, toks, p2)))(listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap(([first, p2]) => (eq(tokAt(toks, p2).tok, TColon) ? _Result_flatMap((p3) => _Result_flatMap(([value, p4]) => _Result_flatMap(([rest, p5]) => _Result_flatMap((p6) => Ok([Ast.EMap(_Array_prepend({ key: first, value: value }, rest), toEnd(start, toks, p6)), p6]))(expectTok(TRbrace, toks, p5)))((eq(tokAt(toks, p4).tok, TComma) ? listUntilH(TRbrace, parseMapEntry, toks, add(p4, 1), hooks) : Ok([[], p4]))))(parseExpr(toks, p3, hooks)))(expectTok(TColon, toks, p2)) : _Result_flatMap(([rest, p3]) => _Result_flatMap((p4) => Ok([Ast.ESet(_Array_prepend(Ast.SEExpr(first), rest), toEnd(start, toks, p4)), p4]))(expectTok(TRbrace, toks, p3)))((eq(tokAt(toks, p2).tok, TComma) ? listUntilH(TRbrace, parseSeqElem, toks, add(p2, 1), hooks) : Ok([[], p2])))))(parseExpr(toks, p1, hooks)))))(expectTok(TLbrace, toks, p)))(expectTok(THash, toks, pos)); });
const parseGuard = _curry(3, (toks, pos, hooks) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TId", value: "when" }, () => _Result_map(([g, p]) => [Some(g), p])(parseExpr(toks, add(pos, 1), hooks)))
  .otherwise(() => Ok([None, pos])));
const patSpan = (p) => match(p)
  .with({ _tag: "PWild" }, ({ span: sp }) => sp)
  .with({ _tag: "PUnit" }, ({ span: sp }) => sp)
  .with({ _tag: "PBind" }, ({ span: sp }) => sp)
  .with({ _tag: "PAs" }, ({ span: sp }) => sp)
  .with({ _tag: "PLit" }, ({ span: sp }) => sp)
  .with({ _tag: "PBool" }, ({ span: sp }) => sp)
  .with({ _tag: "PStr" }, ({ span: sp }) => sp)
  .with({ _tag: "PTuple" }, ({ span: sp }) => sp)
  .with({ _tag: "PRecord" }, ({ span: sp }) => sp)
  .with({ _tag: "PCtor" }, ({ span: sp }) => sp)
  .with({ _tag: "PArr" }, ({ span: sp }) => sp)
  .with({ _tag: "PList" }, ({ span: sp }) => sp)
  .with({ _tag: "POr" }, ({ span: sp }) => sp)
  .exhaustive();
const altsLoop = _curry(4, (toks, pos, acc, lastSpan) => (eq(tokAt(toks, pos).tok, TBar) ? _Result_flatMap(([alt, p1]) => altsLoop(toks, p1, _Array_append(alt, acc), patSpan(alt)))(parsePattern(toks, add(pos, 1))) : Ok([acc, pos, lastSpan])));
const armsLoop = _curry(4, (toks, pos, acc, hooks) => (eq(tokAt(toks, pos).tok, TBar) ? _Result_flatMap(([first, p1]) => _Result_flatMap(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap(([guard, p3]) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => armsLoop(toks, p5, _Array_append({ pattern: pattern, guard: guard, body: body }, acc), hooks))(parseExpr(toks, p4, hooks)))(expectTok(TArrow, toks, p3)))(parseGuard(toks, p2, hooks)))((eq(length(alts), 1) ? first : Ast.POr(alts, spanning(patSpan(first), lastSpan)))))(altsLoop(toks, p1, [first], patSpan(first))))(parsePattern(toks, add(pos, 1))) : Ok([acc, pos])));
const parseDo = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => parseDoBlockFrom(toks, start, p, hooks))(expectTok(TDo, toks, pos)); });
const parseDoBlock = _curry(3, (toks, pos, hooks) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks));
const parseDoBlockFrom = _curry(4, (toks, start, pos, hooks) => _Result_flatMap((p1) => (eq(tokAt(toks, p1).tok, TRbrace) ? errAt("do block needs a final expression", tokAt(toks, p1)) : _Result_flatMap(([exprs, p2]) => (eq(tokAt(toks, p2).tok, TSemi) ? errAt("do block cannot end with a semicolon", tokAt(toks, p2)) : _Result_flatMap((p3) => Ok([Ast.EDo(exprs, toEnd(start, toks, p3)), p3]))(expectTok(TRbrace, toks, p2))))(parseDoExprs(toks, p1, [], hooks))))(expectTok(TLbrace, toks, pos)));
const parseDoExprs = _curry(4, (toks, pos, acc, hooks) => _Result_flatMap(([expr, p]) => ((next) => (eq(tokAt(toks, p).tok, TSemi) ? parseDoExprs(toks, add(p, 1), next, hooks) : Ok([next, p])))(_Array_append(expr, acc)))(parseExpr(toks, pos, hooks)));
const parseLoop = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap((p1) => _Result_flatMap(([params, p2]) => _Result_flatMap((p3) => _Result_flatMap((p4) => _Result_flatMap(([body, p5]) => _Result_map((p6) => [Ast.ELoop(params, body, toEnd(start, toks, p6)), p6])(expectTok(TRbrace, toks, p5)))(parseExpr(toks, p4, hooks)))(expectTok(TLbrace, toks, p3)))(expectTok(TRparen, toks, p2)))(loopParamsLoop(toks, p1, [], hooks)))(expectTok(TLparen, toks, p)))(expectTok(TLoop, toks, pos)); });
const loopParamsLoop = _curry(4, (toks, pos, acc, hooks) => _Result_flatMap(([id, pid]) => _Result_flatMap((p) => _Result_flatMap(([init, p1]) => ((next) => match(tokAt(toks, p1).tok)
  .with({ _tag: "TComma" }, () => loopParamsLoop(toks, add(p1, 1), next, hooks))
  .otherwise(() => Ok([next, p1])))(_Array_append({ name: id.name, nameSpan: id.span, init: init }, acc)))(parseExpr(toks, p, hooks)))(expectTok(TEq, toks, pid)))(expectId(toks, pos)));
const parseRecur = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap((p1) => match(tokAt(toks, p1).tok)
  .with({ _tag: "TRparen" }, () => Ok([Ast.ERecur([], toEnd(start, toks, add(p1, 1))), add(p1, 1)]))
  .otherwise(() => _Result_flatMap(([args, p2]) => _Result_map((p3) => [Ast.ERecur(args, toEnd(start, toks, p3)), p3])(expectTok(TRparen, toks, p2)))(sepByH(parseExpr, toks, p1, [], hooks))))(expectTok(TLparen, toks, p)))(expectTok(TRecur, toks, pos)); });
const parseMatch = _curry(3, (toks, pos, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap(([scrutinee, p1]) => _Result_flatMap((p2) => _Result_flatMap(([arms, p3]) => match(length(arms))
  .with(0, () => errAt("switch needs at least one | arm", tokAt(toks, p3)))
  .otherwise(() => _Result_map((p4) => [Ast.EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4])(expectTok(TRbrace, toks, p3))))(armsLoop(toks, p2, [], hooks)))(expectTok(TLbrace, toks, p1)))(parseExpr(toks, p, hooks)))(expectTok(TSwitch, toks, pos)); });
const parseCtorArgs = _curry(5, (toks, ctor, ns, nameSpan, pos) => (eq(tokAt(toks, pos).tok, TLparen) ? _Result_flatMap(([args, p]) => _Result_flatMap((p2) => Ok([Ast.PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2]))(expectTok(TRparen, toks, p)))(listUntil(TRparen, parsePattern, toks, add(pos, 1))) : Ok([Ast.PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos])));
const parsePatternAtom = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); const sp = spanOf(lt); return match(lt.tok)
  .with({ _tag: "TNum" }, ({ value, raw }) => Ok([Ast.PLit(value, raw, sp), add(pos, 1)]))
  .with({ _tag: "TBool" }, ({ value }) => Ok([Ast.PBool(value, sp), add(pos, 1)]))
  .with({ _tag: "TStr" }, ({ value }) => Ok([Ast.PStr(value, sp), add(pos, 1)]))
  .with({ _tag: "TLparen" }, () => (eq(tokAt(toks, add(pos, 1)).tok, TRparen) ? Ok([Ast.PUnit(toEnd(sp, toks, add(pos, 2))), add(pos, 2)]) : _Result_flatMap(([elems, p]) => _Result_flatMap((p2) => Ok(match(elems)
  .with((_v) => _v.length === 1, ([single]) => [single, p2])
  .otherwise((many) => [Ast.PTuple(many, toEnd(sp, toks, p2)), p2])))(expectTok(TRparen, toks, p)))(sepBy(parsePattern, toks, add(pos, 1), []))))
  .with({ _tag: "TLbrace" }, () => _Result_flatMap(([fields, p]) => _Result_flatMap((p2) => Ok([Ast.PRecord(fields, toEnd(sp, toks, p2)), p2]))(expectTok(TRbrace, toks, p)))(listUntil(TRbrace, parsePatField, toks, add(pos, 1))))
  .with({ _tag: "TLbracket" }, () => parseArrPattern(toks, pos))
  .with({ _tag: "TAt" }, () => parseListPattern(toks, pos))
  .with({ _tag: "TId", value: "_" }, () => Ok([Ast.PWild(sp), add(pos, 1)]))
  .with({ _tag: "TId" }, ({ value: name }) => (eq(tokAt(toks, add(pos, 1)).tok, TDot) ? _Result_flatMap(([c, p1]) => (isUpper(c.name) ? parseCtorArgs(toks, c.name, Some(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt(toks, p1))))(expectId(toks, add(pos, 2))) : (isUpper(name) ? parseCtorArgs(toks, name, None, sp, add(pos, 1)) : Ok([Ast.PBind(name, sp), add(pos, 1)]))))
  .otherwise((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt)); });
const parsePattern = _curry(2, (toks, pos) => _Result_flatMap(([pat, p]) => match(tokAt(toks, p).tok)
  .with({ _tag: "TId", value: "as" }, () => _Result_flatMap(([nm, p2]) => Ok([Ast.PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2]))(expectId(toks, add(p, 1))))
  .otherwise(() => Ok([pat, p])))(parsePatternAtom(toks, pos)));
const restOk = (rest) => match(rest)
  .with({ _tag: "None" }, () => true)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PBind", () => true)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PWild", () => true)
  .with({ _tag: "Some" }, () => false)
  .exhaustive();
const patElemsLoop = _curry(3, (toks, pos, acc) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TSpread" }, () => _Result_flatMap(([rest, p]) => Ok([acc, Some(rest), p]))(parsePattern(toks, add(pos, 1))))
  .otherwise(() => _Result_flatMap(([pat, p]) => ((elems) => (eq(tokAt(toks, p).tok, TComma) ? patElemsLoop(toks, add(p, 1), elems) : Ok([elems, None, p])))(_Array_append(pat, acc)))(parsePattern(toks, pos))));
const parseArrPattern = _curry(2, (toks, pos) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (eq(tokAt(toks, p).tok, TRbracket) ? Ok([Ast.PArr([], None, toEnd(start, toks, add(p, 1))), add(p, 1)]) : _Result_flatMap(([elems, rest, p2]) => (restOk(rest) ? _Result_map((p3) => [Ast.PArr(elems, rest, toEnd(start, toks, p3)), p3])(expectTok(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2))))(patElemsLoop(toks, p, []))))(expectTok(TLbracket, toks, pos)); });
const parseListPattern = _curry(2, (toks, pos) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap((p1) => (eq(tokAt(toks, p1).tok, TRbrace) ? Ok([Ast.PList([], None, toEnd(start, toks, add(p1, 1))), add(p1, 1)]) : _Result_flatMap(([elems, rest, p2]) => (restOk(rest) ? _Result_map((p3) => [Ast.PList(elems, rest, toEnd(start, toks, p3)), p3])(expectTok(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2))))(patElemsLoop(toks, p1, []))))(expectTok(TLbrace, toks, p)))(expectTok(TAt, toks, pos)); });
const parsePatField = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); return _Result_flatMap(([nm, p]) => (eq(tokAt(toks, p).tok, TColon) ? _Result_flatMap(([pat, p2]) => Ok([{ label: nm.name, pat: pat }, p2]))(parsePattern(toks, add(p, 1))) : (not(eq(keywordText(lt.tok), None)) ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <pattern>'`, lt) : Ok([{ label: nm.name, pat: Ast.PBind(nm.name, nm.span) }, p]))))(expectLabel(toks, pos)); });
const parseTypeAtom = _curry(2, (toks, pos) => { const lt = tokAt(toks, pos); const sp = spanOf(lt); return match(lt.tok)
  .with({ _tag: "TLparen" }, () => (eq(tokAt(toks, add(pos, 1)).tok, TRparen) ? Ok([Ast.TyName("unit", toEnd(sp, toks, add(pos, 2))), add(pos, 2)]) : _Result_flatMap(([inner, p]) => (eq(tokAt(toks, p).tok, TComma) ? _Result_flatMap(([elems, p2]) => _Result_flatMap((p3) => Ok([Ast.TyTuple(elems, toEnd(sp, toks, p3)), p3]))(expectTok(TRparen, toks, p2)))(sepBy(parseTypeExpr, toks, add(p, 1), [inner])) : _Result_map((p2) => [inner, p2])(expectTok(TRparen, toks, p))))(parseTypeExpr(toks, add(pos, 1)))))
  .with({ _tag: "TLbracket" }, () => _Result_flatMap(([elem, p]) => _Result_flatMap((p2) => Ok([Ast.TyList(elem, toEnd(sp, toks, p2)), p2]))(expectTok(TRbracket, toks, p)))(parseTypeExpr(toks, add(pos, 1))))
  .with({ _tag: "TStr" }, ({ value }) => Ok([Ast.TyLit(value, sp), add(pos, 1)]))
  .otherwise(() => _Result_flatMap(([nm, p]) => (and(isUpper(nm.name), eq(tokAt(toks, p).tok, TDot)) ? _Result_flatMap(([q, p2]) => (isUpper(q.name) ? Ok([Ast.TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2]) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt(toks, p2))))(expectId(toks, add(p, 1))) : Ok([Ast.TyName(nm.name, nm.span), p])))(expectId(toks, pos))); });
const startsTypeAtom = (t) => match(t)
  .with({ _tag: "TId" }, () => true)
  .with({ _tag: "TLparen" }, () => true)
  .with({ _tag: "TLbracket" }, () => true)
  .with({ _tag: "TStr" }, () => true)
  .otherwise(() => false);
const legacyTypeArgsLoop = _curry(4, (toks, pos, acc, lastSp) => (startsTypeAtom(tokAt(toks, pos).tok) ? _Result_flatMap(([a, p]) => legacyTypeArgsLoop(toks, p, _Array_append(a, acc), Some(tySpan(a))))(parseTypeAtom(toks, pos)) : Ok([acc, lastSp, pos])));
const parseTypeApp = _curry(2, (toks, pos) => _Result_flatMap(([head, p]) => match(head)
  .with((_v) => _v._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_v), ({ name, span: sp }) => (eq(tokAt(toks, p).tok, TLt) ? _Result_flatMap(([args, p1]) => _Result_flatMap((p2) => Ok([Ast.TyApp(name, args, toEnd(sp, toks, p2)), p2]))(expectTok(TGt, toks, p1)))(listUntil(TGt, parseTypeExpr, toks, add(p, 1))) : _Result_flatMap(([args, lastSp, p2]) => Ok(match(lastSp)
  .with({ _tag: "None" }, () => [head, p2])
  .with({ _tag: "Some" }, ({ value: ls }) => [Ast.TyApp(name, args, spanning(sp, ls)), p2])
  .exhaustive()))(legacyTypeArgsLoop(toks, p, [], None))))
  .with({ _tag: "TyQual" }, ({ alias, name: nm, nameSpan, span: sp }) => (eq(tokAt(toks, p).tok, TLt) ? _Result_flatMap(([args, p1]) => _Result_flatMap((p2) => Ok([Ast.TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2]))(expectTok(TGt, toks, p1)))(listUntil(TGt, parseTypeExpr, toks, add(p, 1))) : _Result_flatMap(([args, lastSp, p2]) => Ok(match(lastSp)
  .with({ _tag: "None" }, () => [head, p2])
  .with({ _tag: "Some" }, ({ value: ls }) => [Ast.TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2])
  .exhaustive()))(legacyTypeArgsLoop(toks, p, [], None))))
  .otherwise(() => Ok([head, p])))(parseTypeAtom(toks, pos)));
const parseTypeUnionRest = _curry(4, (toks, pos, acc, lastSp) => (eq(tokAt(toks, pos).tok, TBar) ? _Result_flatMap(([m, p]) => parseTypeUnionRest(toks, p, _Array_append(m, acc), tySpan(m)))(parseTypeApp(toks, add(pos, 1))) : Ok([acc, lastSp, pos])));
const parseTypeUnion = _curry(2, (toks, pos) => _Result_flatMap(([first, p]) => (eq(tokAt(toks, p).tok, TBar) ? _Result_flatMap(([members, lastSp, p2]) => Ok([Ast.TyUnion(members, spanning(tySpan(first), lastSp)), p2]))(parseTypeUnionRest(toks, p, [first], tySpan(first))) : Ok([first, p])))(parseTypeApp(toks, pos)));
const parseTypeExpr = _curry(2, (toks, pos) => _Result_flatMap(([from, p]) => (eq(tokAt(toks, p).tok, TTarrow) ? _Result_flatMap(([to, p2]) => Ok([Ast.TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2]))(parseTypeExpr(toks, add(p, 1))) : Ok([from, p])))(parseTypeUnion(toks, pos)));
const parseCtorField = _curry(2, (toks, pos) => { const isLabel = match(tokAt(toks, pos).tok)
  .with({ _tag: "TId" }, () => eq(tokAt(toks, add(pos, 1)).tok, TColon))
  .otherwise(() => false); return (isLabel ? _Result_flatMap(([nm, p]) => _Result_flatMap(([t, p2]) => Ok([{ name: Some(nm.name), fieldType: t }, p2]))(parseTypeExpr(toks, add(p, 1))))(expectId(toks, pos)) : _Result_map(([t, p]) => [{ name: None, fieldType: t }, p])(parseTypeExpr(toks, pos))); });
const parseCtor = _curry(2, (toks, pos) => _Result_flatMap(([nm, p]) => (eq(tokAt(toks, p).tok, TLparen) ? _Result_flatMap(([fields, p2]) => _Result_flatMap((p3) => Ok([{ name: nm.name, fields: fields }, p3]))(expectTok(TRparen, toks, p2)))(listUntil(TRparen, parseCtorField, toks, add(p, 1))) : Ok([{ name: nm.name, fields: [] }, p])))(expectId(toks, pos)));
const ctorsLoop = _curry(3, (toks, pos, acc) => _Result_flatMap(([c, p]) => ((cs) => (eq(tokAt(toks, p).tok, TBar) ? ctorsLoop(toks, add(p, 1), cs) : Ok([cs, p])))(_Array_append(c, acc)))(parseCtor(toks, pos)));
const parseAliasField = _curry(2, (toks, pos) => _Result_flatMap(([nm, p]) => _Result_flatMap((p2) => _Result_flatMap(([t, p3]) => Ok([{ name: nm.name, fieldType: t }, p3]))(parseTypeExpr(toks, p2)))(expectTok(TColon, toks, p)))(expectLabel(toks, pos)));
const parseAliasBody = _curry(2, (toks, pos) => _Result_flatMap((p) => _Result_flatMap(([fields, p2]) => _Result_flatMap((p3) => Ok([fields, p3]))(expectTok(TRbrace, toks, p2)))(listUntil(TRbrace, parseAliasField, toks, p)))(expectTok(TLbrace, toks, pos)));
const typeParamsLoop = _curry(3, (toks, pos, acc) => match(tokAt(toks, pos).tok)
  .with({ _tag: "TId" }, ({ value: name }) => typeParamsLoop(toks, add(pos, 1), _Array_append(name, acc)))
  .otherwise(() => Ok([acc, pos])));
const parseTypeParams = _curry(2, (toks, pos) => (eq(tokAt(toks, pos).tok, TLt) ? _Result_flatMap(([names, p]) => _Result_map((p2) => [map((n) => n.name, names), p2])(expectTok(TGt, toks, p)))(listUntil(TGt, expectId, toks, add(pos, 1))) : typeParamsLoop(toks, pos, [])));
const startsTypeSynonym = (t) => match(t)
  .with({ _tag: "TStr" }, () => true)
  .with({ _tag: "TLparen" }, () => true)
  .with({ _tag: "TLbracket" }, () => true)
  .otherwise(() => false);
const parseType = _curry(2, (toks, pos) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap(([nm, p1]) => _Result_flatMap(([params, p2]) => _Result_flatMap((p3) => (eq(tokAt(toks, p3).tok, TLbrace) ? _Result_map(([alias, p4]) => [Ast.SType(nm.name, params, [], Some(alias), None, false, None, toEnd(start, toks, p4)), p4])(parseAliasBody(toks, p3)) : (startsTypeSynonym(tokAt(toks, p3).tok) ? _Result_flatMap(([te, p4]) => Ok([Ast.SType(nm.name, params, [], None, Some(te), false, None, toEnd(start, toks, p4)), p4]))(parseTypeExpr(toks, p3)) : ((afterBar) => _Result_map(([ctors, p4]) => [Ast.SType(nm.name, params, ctors, None, None, false, None, toEnd(start, toks, p4)), p4])(ctorsLoop(toks, afterBar, [])))((eq(tokAt(toks, p3).tok, TBar) ? add(p3, 1) : p3)))))(expectTok(TEq, toks, p2)))(parseTypeParams(toks, p1)))(expectId(toks, p)))(expectTok(TType, toks, pos)); });
const parseExtern = _curry(2, (toks, pos) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (eq(tokAt(toks, p).tok, TType) ? _Result_flatMap((p1) => _Result_flatMap(([nm, p2]) => Ok([Ast.SType(nm.name, [], [], None, None, false, None, toEnd(start, toks, p2)), p2]))(expectId(toks, p1)))(expectTok(TType, toks, p)) : _Result_flatMap(([nm, p1]) => _Result_flatMap(([params, p2]) => _Result_flatMap((p3) => _Result_flatMap(([t, p4]) => _Result_flatMap((p5) => ((isCurried) => ((pConv) => ((nextTok) => (or(or(or(or(eq(nextTok, TId("global")), eq(nextTok, TId("send"))), eq(nextTok, TId("get"))), eq(nextTok, TId("set"))), eq(nextTok, TId("new"))) ? (isCurried ? errAt("'curried' applies to a module extern, not a JS convention — give the host's module and export instead", tokAt(toks, pConv)) : _Result_flatMap(([convention, p6]) => _Result_flatMap(([first, p7]) => ((hasSecond) => _Result_flatMap(([second, p8]) => Ok([Ast.SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None, toEnd(start, toks, p8)), p8]))((hasSecond ? expectStr(toks, p7) : Ok(["", p7]))))(match(tokAt(toks, p7).tok)
  .with({ _tag: "TStr" }, () => or(eq(convention.name, "global"), eq(convention.name, "new")))
  .otherwise(() => false)))(expectStr(toks, p6)))(expectId(toks, pConv))) : _Result_flatMap(([moduleName, p6]) => _Result_flatMap(([importedName, p7]) => Ok([Ast.SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None, toEnd(start, toks, p7)), p7]))(expectStr(toks, p6)))(expectStr(toks, pConv))))(tokAt(toks, pConv).tok))((isCurried ? add(p5, 1) : p5)))(eq(tokAt(toks, p5).tok, TId("curried"))))(expectTok(TEq, toks, p4)))(parseTypeExpr(toks, p3)))(expectTok(TColon, toks, p2)))((eq(tokAt(toks, p1).tok, TLt) ? _Result_flatMap(([names, pParams]) => _Result_flatMap((pAfter) => Ok([map((n) => n.name, names), pAfter]))(expectTok(TGt, toks, pParams)))(listUntil(TGt, expectId, toks, add(p1, 1))) : Ok([[], p1]))))(expectId(toks, p))))(expectTok(TExtern, toks, pos)); });
const parseImportNs = _curry(3, (toks, start, pos) => _Result_flatMap(([asKw, p1]) => (eq(asKw.name, "as") ? _Result_flatMap(([alias, p2]) => _Result_flatMap(([kw, p3]) => (eq(kw.name, "from") ? _Result_map(([path, p4]) => [Ast.SImportNs(alias, path, toEnd(start, toks, p4)), p4])(expectStr(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3))))(expectId(toks, p2)))(expectId(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1))))(expectId(toks, pos)));
const parseImport = _curry(2, (toks, pos) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (eq(tokAt(toks, p).tok, TStar) ? _Result_flatMap((p1) => parseImportNs(toks, start, p1))(expectTok(TStar, toks, p)) : _Result_flatMap((p1) => _Result_flatMap(([names, p2]) => _Result_flatMap((p3) => _Result_flatMap(([kw, p4]) => (eq(kw.name, "from") ? _Result_map(([path, p5]) => [Ast.SImport(names, path, toEnd(start, toks, p5)), p5])(expectStr(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p4))))(expectId(toks, p3)))(expectTok(TRbrace, toks, p2)))(listUntil(TRbrace, expectId, toks, p1)))(expectTok(TLbrace, toks, p))))(expectTok(TImport, toks, pos)); });
const parseRecordDestructure = _curry(5, (toks, start, pos, tmp, hooks) => { const openSp = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => _Result_flatMap(([fields, p1]) => ((closeSp) => _Result_flatMap((p2) => _Result_flatMap((p3) => _Result_flatMap(([value, p4]) => ((whole) => ((patSpan) => ((tmpName) => ((header) => ((access) => Ok([_Array_prepend(header, map(access)(fields)), p4, add(tmp, 1)]))((f) => Ast.SLet(f.name, f.span, None, Ast.EField(Ast.ERef(tmpName, f.span), f.name, f.span), false, None, f.span)))(Ast.SLet(tmpName, patSpan, None, value, false, None, whole)))(`$d${show(tmp)}`))(spanning(openSp, closeSp)))(spanning(start, exprSpan(value))))(parseExpr(toks, p3, hooks)))(expectTok(TEq, toks, p2)))(expectTok(TRbrace, toks, p1)))(spanOf(tokAt(toks, p1))))(listUntil(TRbrace, expectId, toks, p)))(expectTok(TLbrace, toks, pos)); });
const parseLet = _curry(4, (toks, pos, tmp, hooks) => { const start = spanOf(tokAt(toks, pos)); return _Result_flatMap((p) => (eq(tokAt(toks, p).tok, TLbrace) ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap(([nm, p1]) => _Result_flatMap(([annot, pA]) => _Result_flatMap((p2) => _Result_flatMap(([value, p3]) => Ok([[Ast.SLet(nm.name, nm.span, annot, value, false, None, spanning(start, exprSpan(value)))], p3, tmp]))(parseExpr(toks, p2, hooks)))(expectTok(TEq, toks, pA)))((eq(tokAt(toks, p1).tok, TColon) ? _Result_map(([ty, p]) => [Some(ty), p])(parseTypeExpr(toks, add(p1, 1))) : Ok([None, p1]))))(expectId(toks, p))))(expectTok(TLet, toks, pos)); });
const setLetMeta = _curry(3, (exported, doc, s) => match(s)
  .with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, span }) => Ast.SLet(name, nameSpan, annot, value, exported, doc, span))
  .otherwise((other) => other));
const setTypeMeta = _curry(3, (exported, doc, s) => match(s)
  .with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => Ast.SType(name, params, ctors, alias, aliasType, exported, doc, span))
  .otherwise((other) => other));
const setExternMeta = _curry(3, (exported, doc, s) => match(s)
  .with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) => Ast.SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span))
  .with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => Ast.SType(name, params, ctors, alias, aliasType, exported, doc, span))
  .otherwise((other) => other));
const setExternExported = (s) => setExternMeta(true, None, s);
const parseExprStmt = _curry(4, (toks, pos, tmp, hooks) => { const start = tokAt(toks, pos); return _Result_flatMap(([value, p]) => ((p2) => Ok([[Ast.SExpr(value, spanning(start, exprSpan(value)))], p2, tmp]))((eq(tokAt(toks, p).tok, TSemi) ? add(p, 1) : p)))(parseExpr(toks, pos, hooks)); });
const parseStmt = _curry(4, (toks, pos, tmp, hooks) => { const lt = tokAt(toks, pos); const doc = lt.doc; return match(lt.tok)
  .with({ _tag: "TImport" }, () => _Result_map(([s, p]) => [[s], p, tmp])(parseImport(toks, pos)))
  .with({ _tag: "TExport" }, () => match(tokAt(toks, add(pos, 1)).tok)
  .with({ _tag: "TType" }, () => _Result_map(([s, p]) => [[setTypeMeta(true, doc, s)], p, tmp])(parseType(toks, add(pos, 1))))
  .with({ _tag: "TExtern" }, () => _Result_map(([s, p]) => [[setExternMeta(true, doc, s)], p, tmp])(parseExtern(toks, add(pos, 1))))
  .with({ _tag: "TLet" }, () => _Result_map(([stmts, p, tmp2]) => [map(setLetMeta(true, doc))(stmts), p, tmp2])(parseLet(toks, add(pos, 1), tmp, hooks)))
  .otherwise(() => errAt("`export` must precede let, type, or extern", tokAt(toks, add(pos, 1)))))
  .with({ _tag: "TType" }, () => _Result_map(([s, p]) => [[setTypeMeta(false, doc, s)], p, tmp])(parseType(toks, pos)))
  .with({ _tag: "TExtern" }, () => _Result_map(([s, p]) => [[setExternMeta(false, doc, s)], p, tmp])(parseExtern(toks, pos)))
  .with({ _tag: "TLet" }, () => _Result_map(([stmts, p, tmp2]) => [map(setLetMeta(false, doc))(stmts), p, tmp2])(parseLet(toks, pos, tmp, hooks)))
  .otherwise(() => parseExprStmt(toks, pos, tmp, hooks)); });
const isSyncTok = (t) => match(t)
  .with({ _tag: "TLet" }, () => true)
  .with({ _tag: "TType" }, () => true)
  .with({ _tag: "TExtern" }, () => true)
  .with({ _tag: "TImport" }, () => true)
  .with({ _tag: "TExport" }, () => true)
  .otherwise(() => false);
const isOpener = (t) => or(or(eq(t, TLparen), eq(t, TLbrace)), eq(t, TLbracket));
const isCloser = (t) => or(or(eq(t, TRparen), eq(t, TRbrace)), eq(t, TRbracket));
const maxParseErrors = 100;
const resumeAt = _curry(3, (toks, pos, at) => (and(lt(add(pos, 1), length(toks)), lt(tokAt(toks, pos).start, at)) ? resumeAt(toks, add(pos, 1), at) : pos));
const skipToSync = _curry(3, (toks, pos, depth) => { const t = tokAt(toks, pos).tok; return (or(eq(t, TEof), and(eq(depth, 0), isSyncTok(t))) ? pos : skipToSync(toks, add(pos, 1), (isOpener(t) ? add(depth, 1) : (and(isCloser(t), gt(depth, 0)) ? sub(depth, 1) : depth)))); });
const recoverFrom = _curry(4, (toks, before, failedAt, at) => { const resume = resumeAt(toks, before, at); const start = (eq(resume, before) ? add(before, 1) : resume); const final = skipToSync(toks, start, 0); return { node: Ast.SError({ start: failedAt.start, end: tokAt(toks, sub(final, 1)).end }), pos: final }; });
const stmtsLoop = _curry(6, (toks, pos0, tmp0, acc0, diags0, hooks) => { let pos = pos0; let tmp = tmp0; let acc = acc0; let diags = diags0; while (true) { if (eq(tokAt(toks, pos).tok, TEof)) { return { stmts: acc, diagnostics: diags }; } else { { const failedAt = tokAt(toks, pos); const _step = match(parseStmt(toks, pos, tmp, hooks))
  .with((_v) => _v._tag === "Ok", ({ value: [stmts, p, tmp2] }) => (eq(p, pos) ? ((r) => _recur(r.pos, tmp, _Array_append(r.node, acc), _Array_append({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur(p, tmp2, _Array_concat(acc, stmts), diags)))
  .with({ _tag: "Err" }, ({ error: d }) => ((ds) => (gte(length(ds), maxParseErrors) ? _done({ stmts: _Array_append(Ast.SError({ start: failedAt.start, end: tokAt(toks, sub(length(toks), 1)).end }), acc), diagnostics: _Array_append({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur(r.pos, tmp, _Array_append(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start))))(_Array_append(d, diags)))
  .exhaustive(); if (_step._tag === "recur") { [pos, tmp, acc, diags] = _step.args; continue; } return _step.value; } } } });
export const parseRecovering = _curry(2, (toks, pluginsOpt) => { const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt)); return stmtsLoop(toks, match(tokAt(toks, 0).tok)
  .with({ _tag: "TStr" }, ({ value }) => (eq(value, "use open") ? 1 : 0))
  .otherwise(() => 0), 0, [], [], hooks); });
export const parse = (toks) => parseWith(toks, None);
export const parseWith = _curry(2, (toks, pluginsOpt) => { const r = parseRecovering(toks, pluginsOpt); return match(_Array_get(0, r.diagnostics))
  .with({ _tag: "Some" }, ({ value: d }) => Err(d))
  .with({ _tag: "None" }, () => Ok(r.stmts))
  .exhaustive(); });
