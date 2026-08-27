const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};



export const LPName = _curry(2, (name, annot) => ({ _tag: "LPName", name, annot }));
export const LPRecord = (fields) => ({ _tag: "LPRecord", fields });
export const LPTuple = (names) => ({ _tag: "LPTuple", names });





export const SEExpr = (expr) => ({ _tag: "SEExpr", expr });
export const SESpread = (expr) => ({ _tag: "SESpread", expr });
export const ENum = _curry(3, (value, raw, span) => ({ _tag: "ENum", value, raw, span }));
export const EUnit = (span) => ({ _tag: "EUnit", span });
export const EBool = _curry(2, (value, span) => ({ _tag: "EBool", value, span }));
export const EStr = _curry(2, (value, span) => ({ _tag: "EStr", value, span }));
export const ERef = _curry(2, (name, span) => ({ _tag: "ERef", name, span }));
export const ECall = _curry(4, (fn, args, origin, span) => ({ _tag: "ECall", fn, args, origin, span }));
export const ELambda = _curry(3, (params, body, span) => ({ _tag: "ELambda", params, body, span }));
export const ELetIn = _curry(5, (name, nameSpan, value, body, span) => ({ _tag: "ELetIn", name, nameSpan, value, body, span }));
export const ELetBind = _curry(6, (param, paramSpan, monad, value, body, span) => ({ _tag: "ELetBind", param, paramSpan, monad, value, body, span }));
export const EPipe = _curry(3, (left, right, span) => ({ _tag: "EPipe", left, right, span }));
export const EDo = _curry(2, (exprs, span) => ({ _tag: "EDo", exprs, span }));
export const ETernary = _curry(4, (cond, thenE, elseE, span) => ({ _tag: "ETernary", cond, thenE, elseE, span }));
export const EMatch = _curry(3, (scrutinee, arms, span) => ({ _tag: "EMatch", scrutinee, arms, span }));
export const ERecord = _curry(3, (fields, spread, span) => ({ _tag: "ERecord", fields, spread, span }));
export const EField = _curry(3, (target, name, span) => ({ _tag: "EField", target, name, span }));
export const ETuple = _curry(2, (elements, span) => ({ _tag: "ETuple", elements, span }));
export const EArr = _curry(2, (elements, span) => ({ _tag: "EArr", elements, span }));
export const EList = _curry(2, (elements, span) => ({ _tag: "EList", elements, span }));
export const ESet = _curry(2, (elements, span) => ({ _tag: "ESet", elements, span }));
export const EMap = _curry(2, (entries, span) => ({ _tag: "EMap", entries, span }));
export const ELoop = _curry(3, (params, body, span) => ({ _tag: "ELoop", params, body, span }));
export const ERecur = _curry(2, (args, span) => ({ _tag: "ERecur", args, span }));
export const EInterp = _curry(2, (parts, span) => ({ _tag: "EInterp", parts, span }));
export const IPLit = (value) => ({ _tag: "IPLit", value });
export const IPExpr = (expr) => ({ _tag: "IPExpr", expr });
export const PWild = (span) => ({ _tag: "PWild", span });
export const PUnit = (span) => ({ _tag: "PUnit", span });
export const PBind = _curry(2, (name, span) => ({ _tag: "PBind", name, span }));
export const PAs = _curry(4, (pat, name, nameSpan, span) => ({ _tag: "PAs", pat, name, nameSpan, span }));
export const PLit = _curry(3, (value, raw, span) => ({ _tag: "PLit", value, raw, span }));
export const PBool = _curry(2, (value, span) => ({ _tag: "PBool", value, span }));
export const PStr = _curry(2, (value, span) => ({ _tag: "PStr", value, span }));
export const PTuple = _curry(2, (elems, span) => ({ _tag: "PTuple", elems, span }));
export const PRecord = _curry(2, (fields, span) => ({ _tag: "PRecord", fields, span }));
export const PCtor = _curry(4, (ctor, args, ns, span) => ({ _tag: "PCtor", ctor, args, ns, span }));
export const PArr = _curry(3, (elems, rest, span) => ({ _tag: "PArr", elems, rest, span }));
export const PList = _curry(3, (elems, rest, span) => ({ _tag: "PList", elems, rest, span }));
export const POr = _curry(2, (alts, span) => ({ _tag: "POr", alts, span }));
export const TyName = _curry(2, (name, span) => ({ _tag: "TyName", name, span }));
export const TyArrow = _curry(3, (from, to, span) => ({ _tag: "TyArrow", from, to, span }));
export const TyApp = _curry(3, (ctor, args, span) => ({ _tag: "TyApp", ctor, args, span }));
export const TyTuple = _curry(2, (elems, span) => ({ _tag: "TyTuple", elems, span }));
export const TyList = _curry(2, (elem, span) => ({ _tag: "TyList", elem, span }));
export const TyQual = _curry(5, (alias, name, nameSpan, args, span) => ({ _tag: "TyQual", alias, name, nameSpan, args, span }));
export const TyLit = _curry(2, (value, span) => ({ _tag: "TyLit", value, span }));
export const TyUnion = _curry(2, (members, span) => ({ _tag: "TyUnion", members, span }));



export const SLet = _curry(7, (name, nameSpan, annot, value, exported, doc, span) => ({ _tag: "SLet", name, nameSpan, annot, value, exported, doc, span }));
export const SType = _curry(8, (name, params, ctors, alias, aliasType, exported, doc, span) => ({ _tag: "SType", name, params, ctors, alias, aliasType, exported, doc, span }));
export const SExtern = _curry(10, (name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span) => ({ _tag: "SExtern", name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }));
export const SImport = _curry(3, (names, from, span) => ({ _tag: "SImport", names, from, span }));
export const SImportNs = _curry(3, (alias, from, span) => ({ _tag: "SImportNs", alias, from, span }));
export const SExpr = _curry(2, (value, span) => ({ _tag: "SExpr", value, span }));
export const SError = (span) => ({ _tag: "SError", span });
