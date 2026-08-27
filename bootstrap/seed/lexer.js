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
const div = _curry(2, (a, b) => a / b);
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
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const _Option_exists = _curry(2, (p, o) => o._tag === "Some" && p(o.value));
const _Option_contains = _curry(2, (x, o) => o._tag === "Some" && eq(x, o.value));
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_tail = (xs) => xs.slice(1);
const _Str_length = (s) => s.length;
const _Str_join = _curry(2, (sep, xs) => xs.join(sep));
const _Str_slice = _curry(3, (start, end, s) => s.slice(start, end));
const _Str_get = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s[i]) : None);
const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);
const _Str_fromCode = (n) => String.fromCharCode(n);
const _Str_toNumber = (s) => {
  const n = Number(s);
  return Number.isNaN(n) ? None : Some(n);
};

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
const DocLine = _curry(2, (text, stop) => ({ _tag: "DocLine", text, stop }));
const PlainOwn = (stop) => ({ _tag: "PlainOwn", stop });
const Trailing = (stop) => ({ _tag: "Trailing", stop });
const cr = _Str_fromCode(13);
const isSpace = (c) => or(eq(c, " "), or(eq(c, "\t"), or(eq(c, "\n"), eq(c, cr))));
const inRange = _curry(3, (lo, hi, n) => and(gte(n, lo), lte(n, hi)));
const isDigit = (c) => _Option_exists(inRange(48, 57))(_Str_codeAt(0, c));
const isIdStart = (c) => _Option_exists((n) => or(inRange(65, 90, n), or(inRange(97, 122, n), or(eq(n, 95), eq(n, 36)))))(_Str_codeAt(0, c));
const isIdChar = (c) => or(isIdStart(c), isDigit(c));
const isNumChar = (c) => or(isDigit(c), eq(c, "."));
const keywordTok = (word) => match(word)
  .with("let", () => Some(TLet))
  .with("type", () => Some(TType))
  .with("extern", () => Some(TExtern))
  .with("switch", () => Some(TSwitch))
  .with("loop", () => Some(TLoop))
  .with("recur", () => Some(TRecur))
  .with("do", () => Some(TDo))
  .with("import", () => Some(TImport))
  .with("export", () => Some(TExport))
  .with("true", () => Some(TBool(true)))
  .with("false", () => Some(TBool(false)))
  .otherwise(() => None);
const identTok = (word) => _Option_unwrapOr(TId(word))(keywordTok(word));
const digraphTok = (two) => match(two)
  .with("|>", () => Some(TPipe))
  .with(">>", () => Some(TCompose))
  .with("++", () => Some(TConcat))
  .with("==", () => Some(TEqeq))
  .with("!=", () => Some(TNeq))
  .with("<=", () => Some(TLte))
  .with(">=", () => Some(TGte))
  .with("&&", () => Some(TAndand))
  .with("||", () => Some(TOror))
  .with("=>", () => Some(TArrow))
  .with("->", () => Some(TTarrow))
  .otherwise(() => None);
const punctTok = (c) => match(c)
  .with("|", () => Some(TBar))
  .with("=", () => Some(TEq))
  .with("(", () => Some(TLparen))
  .with(")", () => Some(TRparen))
  .with("{", () => Some(TLbrace))
  .with("}", () => Some(TRbrace))
  .with("[", () => Some(TLbracket))
  .with("]", () => Some(TRbracket))
  .with(",", () => Some(TComma))
  .with(";", () => Some(TSemi))
  .with(".", () => Some(TDot))
  .with(":", () => Some(TColon))
  .with("?", () => Some(TQuestion))
  .with("@", () => Some(TAt))
  .with("#", () => Some(THash))
  .with("+", () => Some(TPlus))
  .with("-", () => Some(TMinus))
  .with("*", () => Some(TStar))
  .with("/", () => Some(TSlash))
  .with("%", () => Some(TPercent))
  .with("!", () => Some(TBang))
  .with("`", () => Some(TBacktick))
  .with("<", () => Some(TLt))
  .with(">", () => Some(TGt))
  .otherwise(() => None);
const scanWhile = _curry(3, (pred, src, j) => match(_Str_get(j, src))
  .with((_v) => _v._tag === "Some" && (({ value: c }) => pred(c))(_v), ({ value: c }) => scanWhile(pred, src, add(j, 1)))
  .otherwise(() => j));
const escChar = (n) => match(n)
  .with("n", () => "\n")
  .with("t", () => "\t")
  .otherwise((c) => c);
const PLit = (value) => ({ _tag: "PLit", value });
const PHole = _curry(2, (start, end) => ({ _tag: "PHole", start, end }));
const skipStrLoop = _curry(2, (src, j0) => { let j = j0; while (true) { const _step = match(_Str_get(j, src))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some", value: "\"" }, () => _done(Some(add(j, 1))))
  .with({ _tag: "Some", value: "\\" }, () => match(_Str_get(add(j, 1), src))
  .with({ _tag: "Some" }, () => _recur(add(j, 2)))
  .with({ _tag: "None" }, () => _recur(add(j, 1)))
  .exhaustive())
  .with((_v) => _v._tag === "Some" && _v.value === "$" && (_Option_contains("{")(_Str_get(add(j, 1), src))), () => match(findHoleEnd(src, add(j, 2)))
  .with({ _tag: "Some" }, ({ value: hEnd }) => _recur(hEnd))
  .with({ _tag: "None" }, () => _done(None))
  .exhaustive())
  .with({ _tag: "Some" }, () => _recur(add(j, 1)))
  .exhaustive(); if (_step._tag === "recur") { j = _step.args[0]; continue; } return _step.value; } });
const skipStringLiteral = _curry(2, (src, i) => skipStrLoop(src, add(i, 1)));
const skipLineCommentTo = _curry(2, (src, j) => match(_Str_get(j, src))
  .with({ _tag: "None" }, () => j)
  .with({ _tag: "Some", value: "\n" }, () => j)
  .with({ _tag: "Some" }, () => skipLineCommentTo(src, add(j, 1)))
  .exhaustive());
const findHoleLoop = _curry(3, (src, j0, depth0) => { let j = j0; let depth = depth0; while (true) { const _step = match(_Str_get(j, src))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some", value: "\"" }, () => match(skipStringLiteral(src, j))
  .with({ _tag: "Some" }, ({ value: stop }) => _recur(stop, depth))
  .with({ _tag: "None" }, () => _done(None))
  .exhaustive())
  .with((_v) => _v._tag === "Some" && _v.value === "/" && (_Option_contains("/")(_Str_get(add(j, 1), src))), () => _recur(skipLineCommentTo(src, j), depth))
  .with({ _tag: "Some", value: "{" }, () => _recur(add(j, 1), add(depth, 1)))
  .with({ _tag: "Some", value: "}" }, () => (eq(depth, 1) ? _done(Some(add(j, 1))) : _recur(add(j, 1), sub(depth, 1))))
  .with({ _tag: "Some" }, () => _recur(add(j, 1), depth))
  .exhaustive(); if (_step._tag === "recur") { [j, depth] = _step.args; continue; } return _step.value; } });
const findHoleEnd = _curry(2, (src, start) => findHoleLoop(src, start, 1));
const literalTok = _curry(3, (idx, total, value) => (eq(total, 1) ? TStr(value) : (eq(idx, 0) ? TTmplStart(value) : (eq(idx, sub(total, 1)) ? TTmplEnd(value) : TTmplMid(value)))));
const scanTemplateLoop = _curry(4, (src, j0, value0, parts0) => { let j = j0; let value = value0; let parts = parts0; while (true) { const _step = match(_Str_get(j, src))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some", value: "\"" }, () => _done(Some({ parts: _Array_append(PLit(value), parts), end: add(j, 1) })))
  .with({ _tag: "Some", value: "\\" }, () => match(_Str_get(add(j, 1), src))
  .with({ _tag: "Some" }, ({ value: n }) => _recur(add(j, 2), `${value}${escChar(n)}`, parts))
  .with({ _tag: "None" }, () => _recur(add(j, 1), `${value}\\`, parts))
  .exhaustive())
  .with((_v) => _v._tag === "Some" && _v.value === "$" && (_Option_contains("{")(_Str_get(add(j, 1), src))), () => match(findHoleEnd(src, add(j, 2)))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some" }, ({ value: holeEnd }) => ((withLit) => ((withHole) => _recur(holeEnd, "", withHole))(_Array_append(PHole(add(j, 2), sub(holeEnd, 1)), withLit)))(_Array_append(PLit(value), parts)))
  .exhaustive())
  .with({ _tag: "Some" }, ({ value: c }) => _recur(add(j, 1), `${value}${c}`, parts))
  .exhaustive(); if (_step._tag === "recur") { [j, value, parts] = _step.args; continue; } return _step.value; } });
const scanTemplate = _curry(2, (src, i) => scanTemplateLoop(src, add(i, 1), "", []));
const notNewline = (c) => not(eq(c, "\n"));
const scanComment = _curry(3, (src, start, lineTok) => { const stop = scanWhile(notNewline, src, start); return (lineTok ? Trailing(stop) : (_Option_contains("/")(_Str_get(add(start, 2), src)) ? ((textStart) => DocLine(_Str_slice(textStart, stop, src), stop))((_Option_contains(" ")(_Str_get(add(start, 3), src)) ? add(start, 4) : add(start, 3))) : PlainOwn(stop))); });
const mkTok = _curry(4, (tok, start, stop, doc) => match(doc)
  .with((_v) => _v.length === 0, () => ({ tok: tok, start: start, end: stop, doc: None }))
  .otherwise((lines) => ({ tok: tok, start: start, end: stop, doc: Some(_Str_join("\n", lines)) })));
const lexError = _curry(3, (message, start, stop) => Err({ message: message, start: start, end: stop }));
const numValue = (raw) => _Option_unwrapOr(div(0, 0))(_Str_toNumber(raw));
const numStart = _curry(3, (src, i, c) => or(isDigit(c), and(eq(c, "-"), _Option_exists(isDigit)(_Str_get(add(i, 1), src)))));
const offsetLocTok = _curry(2, (lt, by) => ({ tok: lt.tok, start: add(lt.start, by), end: add(lt.end, by), doc: lt.doc }));
const spliceHoleToks = _curry(3, (holeToks, by, toks) => match(_Array_head(holeToks))
  .with({ _tag: "None" }, () => toks)
  .with({ _tag: "Some" }, ({ value: ht }) => ((toks2) => spliceHoleToks(_Array_tail(holeToks), by, toks2))((eq(ht.tok, TEof) ? toks : _Array_append(offsetLocTok(ht, by), toks))))
  .exhaustive());
const spliceHole = _curry(4, (src, start, stop, toks) => match(lex(_Str_slice(start, stop, src)))
  .with({ _tag: "Ok" }, ({ value: holeToks }) => Ok(spliceHoleToks(holeToks, start, toks)))
  .with({ _tag: "Err" }, ({ error: e }) => Err({ message: e.message, start: add(e.start, start), end: add(e.end, start) }))
  .exhaustive());
const lexParts = _curry(8, (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => match(_Array_head(parts))
  .with({ _tag: "None" }, () => Ok(toks))
  .with({ _tag: "Some" }, ({ value: part }) => match(part)
  .with({ _tag: "PLit" }, ({ value }) => ((t) => lexParts(src, _Array_tail(parts), add(idx, 1), total, wholeStart, wholeEnd, [], _Array_append(t, toks)))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc)))
  .with({ _tag: "PHole" }, ({ start: hs, end: he }) => match(spliceHole(src, hs, he, toks))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: toks2 }) => lexParts(src, _Array_tail(parts), add(idx, 1), total, wholeStart, wholeEnd, doc, toks2))
  .exhaustive())
  .exhaustive())
  .exhaustive());
const emit = _curry(6, (src, tok, start, stop, doc, toks) => go(src, stop, [], 0, true, _Array_append(mkTok(tok, start, stop, doc), toks)));
const lexString = _curry(4, (src, i, doc, toks) => match(scanTemplate(src, i))
  .with({ _tag: "None" }, () => lexError("unterminated string literal", i, _Str_length(src)))
  .with({ _tag: "Some" }, ({ value: scanned }) => match(lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: toks2 }) => go(src, scanned.end, [], 0, true, toks2))
  .exhaustive())
  .exhaustive());
const go = _curry(6, (src, i, doc, nlRun, lineTok, toks) => match(_Str_get(i, src))
  .with({ _tag: "None" }, () => Ok(_Array_append(mkTok(TEof, i, i, doc), toks)))
  .with((_v) => _v._tag === "Some" && (({ value: c }) => isSpace(c))(_v), ({ value: c }) => (eq(c, "\n") ? ((n) => ((kept) => go(src, add(i, 1), kept, n, false, toks))((lt(n, 2) ? doc : [])))(add(nlRun, 1)) : go(src, add(i, 1), doc, nlRun, lineTok, toks)))
  .with((_v) => _v._tag === "Some" && _v.value === "/" && (_Option_contains("/")(_Str_get(add(i, 1), src))), () => match(scanComment(src, i, lineTok))
  .with({ _tag: "Trailing" }, ({ stop }) => go(src, stop, doc, nlRun, lineTok, toks))
  .with({ _tag: "PlainOwn" }, ({ stop }) => go(src, stop, [], 0, lineTok, toks))
  .with({ _tag: "DocLine" }, ({ text, stop }) => go(src, stop, _Array_append(text, doc), 0, lineTok, toks))
  .exhaustive())
  .with({ _tag: "Some" }, ({ value: c }) => (eq(_Str_slice(i, add(i, 3), src), "...") ? emit(src, TSpread, i, add(i, 3), doc, toks) : match(digraphTok(_Str_slice(i, add(i, 2), src)))
  .with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, add(i, 2), doc, toks))
  .with({ _tag: "None" }, () => (eq(c, "\"") ? lexString(src, i, doc, toks) : (numStart(src, i, c) ? ((j) => ((raw) => emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(_Str_slice(i, j, src)))(scanWhile(isNumChar, src, add(i, 1))) : match(punctTok(c))
  .with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, add(i, 1), doc, toks))
  .with({ _tag: "None" }, () => (isIdStart(c) ? ((j) => emit(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(scanWhile(isIdChar, src, add(i, 1))) : lexError(`unexpected char '${c}'`, i, add(i, 1))))
  .exhaustive())))
  .exhaustive()))
  .exhaustive());
export const lex = (src) => go(src, 0, [], 0, false, []);
