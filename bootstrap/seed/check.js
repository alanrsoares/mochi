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
const gt = _curry(2, (a, b) => a > b);
const gte = _curry(2, (a, b) => a >= b);
const lte = _curry(2, (a, b) => a <= b);
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));
const _Set_has = _curry(2, (x, s) => s.has(x));
const _Set_add = _curry(2, (x, s) => new Set(s).add(x));
const _Set_fromArray = (xs) => new Set(xs);
const _Map_has = _curry(2, (k, m) => m.has(k));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Option_orElse = _curry(2, (fb, o) => o._tag === "Some" ? o : fb);
const _Option_isSome = (o) => o._tag === "Some";
const _Option_isNone = (o) => o._tag === "None";
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));
const _Array_contains = _curry(2, (x, xs) => xs.some((y) => eq(x, y)));
const _Str_join = _curry(2, (sep, xs) => xs.join(sep));
const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);

import * as Ast from "./ast.js";
import { buildRegistry, primTypeNames } from "./ctors.js";
import { checkExhaustiveM, isWideWitnessM, showWitness, ExOk, ExWitness, ExFuel } from "./usefulness.js";



const checkErr = _curry(2, (message, sp) => ({ message: message, start: sp.start, end: sp.end }));
const firstSomeFrom = _curry(3, (f, xs, i0) => { let i = i0; while (true) { const _step = match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some" }, ({ value: x }) => match(f(x))
  .with({ _tag: "Some" }, ({ value: e }) => _done(Some(e)))
  .with({ _tag: "None" }, () => _recur(add(i, 1)))
  .exhaustive())
  .exhaustive(); if (_step._tag === "recur") { i = _step.args[0]; continue; } return _step.value; } });
const firstSome = _curry(2, (f, xs) => firstSomeFrom(f, xs, 0));
const allOfFrom = _curry(3, (f, xs, i0) => { let i = i0; while (true) { const _step = match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => _done(true))
  .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? _recur(add(i, 1)) : _done(false)))
  .exhaustive(); if (_step._tag === "recur") { i = _step.args[0]; continue; } return _step.value; } });
const allOf = _curry(2, (f, xs) => allOfFrom(f, xs, 0));
const someOfFrom = _curry(3, (f, xs, i0) => { let i = i0; while (true) { const _step = match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => _done(false))
  .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? _done(true) : _recur(add(i, 1))))
  .exhaustive(); if (_step._tag === "recur") { i = _step.args[0]; continue; } return _step.value; } });
const someOf = _curry(2, (f, xs) => someOfFrom(f, xs, 0));
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
const isCatchAll = (p) => match(p)
  .with({ _tag: "PWild" }, () => true)
  .with({ _tag: "PUnit" }, () => true)
  .with({ _tag: "PBind" }, () => true)
  .with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat))
  .with({ _tag: "PRecord" }, ({ fields }) => allOf((f) => isCatchAll(f.pat), fields))
  .with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems))
  .with({ _tag: "PArr" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
  .with({ _tag: "PList" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
  .otherwise(() => false);
const isPList = (p) => match(p)
  .with({ _tag: "PList" }, () => true)
  .otherwise(() => false);
const isPCtor = (p) => match(p)
  .with({ _tag: "PCtor" }, () => true)
  .otherwise(() => false);
const ctorNameOf = (p) => match(p)
  .with({ _tag: "PCtor" }, ({ ctor: name }) => name)
  .otherwise(() => "");
const patCtorKey = _curry(2, (ctor, ns) => match(ns)
  .with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctor}`)
  .with({ _tag: "None" }, () => ctor)
  .exhaustive());
const seqElemsRest = (p) => match(p)
  .with({ _tag: "PArr" }, ({ elems, rest }) => Some([elems, rest]))
  .with({ _tag: "PList" }, ({ elems, rest }) => Some([elems, rest]))
  .otherwise(() => None);
const checkPattern = _curry(3, (p, reg, top) => match(p)
  .with({ _tag: "PAs" }, ({ pat }) => checkPattern(pat, reg, top))
  .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match(_Map_get(key, reg.ctors))
  .with({ _tag: "None" }, () => Some(checkErr(`unknown constructor '${key}'`, sp)))
  .with({ _tag: "Some" }, ({ value: info }) => (eq(length(args), info.arity) ? firstSome((a) => checkPattern(a, reg, false), args) : Some(checkErr(`constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`, sp))))
  .exhaustive())(patCtorKey(ctor, ns)))
  .with({ _tag: "PRecord" }, ({ fields }) => firstSome((f) => checkPattern(f.pat, reg, false), fields))
  .with({ _tag: "PTuple" }, ({ elems }) => firstSome((el) => checkPattern(el, reg, false), elems))
  .with({ _tag: "PArr" }, ({ elems, rest }) => _Option_orElse(match(rest)
  .with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false))
  .with({ _tag: "None" }, () => None)
  .exhaustive())(firstSome((el) => checkPattern(el, reg, false), elems)))
  .with({ _tag: "PList" }, ({ elems, rest, span: sp }) => (top ? _Option_orElse(match(rest)
  .with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false))
  .with({ _tag: "None" }, () => None)
  .exhaustive())(firstSome((el) => checkPattern(el, reg, false), elems)) : Some(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp))))
  .with({ _tag: "POr" }, ({ alts, span: sp }) => checkOrPattern(alts, sp, reg))
  .otherwise(() => None));
const binderPathsArgs = _curry(4, (args, i, at, acc) => match(_Array_get(i, args))
  .with({ _tag: "None" }, () => Ok(acc))
  .with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap((acc2) => binderPathsArgs(args, add(i, 1), at, acc2))(binderPaths(a, `${at}.a${show(i)}`, acc)))
  .exhaustive());
const binderPathsFields = _curry(4, (fields, i, at, acc) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => Ok(acc))
  .with({ _tag: "Some" }, ({ value: f }) => _Result_flatMap((acc2) => binderPathsFields(fields, add(i, 1), at, acc2))(binderPaths(f.pat, `${at}.${f.label}`, acc)))
  .exhaustive());
const binderPathsElems = _curry(4, (elems, i, at, acc) => match(_Array_get(i, elems))
  .with({ _tag: "None" }, () => Ok(acc))
  .with({ _tag: "Some" }, ({ value: e }) => _Result_flatMap((acc2) => binderPathsElems(elems, add(i, 1), at, acc2))(binderPaths(e, `${at}.t${show(i)}`, acc)))
  .exhaustive());
const binderPaths = _curry(3, (p, at, acc) => match(p)
  .with({ _tag: "PAs" }, ({ pat, name, nameSpan: nameSp }) => _Result_flatMap((acc1) => (_Map_has(name, acc1) ? Err(checkErr(`pattern binds '${name}' more than once`, nameSp)) : Ok(_Map_set(name, at, acc1))))(binderPaths(pat, at, acc)))
  .with({ _tag: "PBind" }, ({ name, span: sp }) => (_Map_has(name, acc) ? Err(checkErr(`pattern binds '${name}' more than once`, sp)) : Ok(_Map_set(name, at, acc))))
  .with({ _tag: "PCtor" }, ({ args }) => binderPathsArgs(args, 0, at, acc))
  .with({ _tag: "PRecord" }, ({ fields }) => binderPathsFields(fields, 0, at, acc))
  .with({ _tag: "PTuple" }, ({ elems }) => binderPathsElems(elems, 0, at, acc))
  .otherwise(() => Ok(acc)));
const altMapsFrom = _curry(4, (alts, i, reg, acc) => match(_Array_get(i, alts))
  .with({ _tag: "None" }, () => Ok(acc))
  .with({ _tag: "Some" }, ({ value: alt }) => (isCatchAll(alt) ? Err(checkErr("an or-pattern alternative can't be a catch-all (`_` or a bare binding)", patSpan(alt))) : (_Option_isSome(seqElemsRest(alt)) ? Err(checkErr("array/list patterns can't appear as an or-pattern alternative", patSpan(alt))) : match(checkPattern(alt, reg, false))
  .with({ _tag: "Some" }, ({ value: e }) => Err(e))
  .with({ _tag: "None" }, () => _Result_flatMap((m) => altMapsFrom(alts, add(i, 1), reg, _Array_append(m, acc)))(binderPaths(alt, "", new Map([]))))
  .exhaustive())))
  .exhaustive());
const missingNameErr = _curry(2, (name, sp) => checkErr(`or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`, sp));
const consistentBindsFrom = _curry(4, (maps, i, ref, sp) => match(_Array_get(i, maps))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: m }) => _Option_orElse(consistentBindsFrom(maps, add(i, 1), ref, sp))(_Option_orElse(firstSome((name) => (_Map_has(name, ref) ? (eq(_Map_getOr("", name, ref), _Map_getOr("", name, m)) ? None : Some(checkErr(`or-pattern binds '${name}' at a differing position across alternatives`, sp))) : Some(missingNameErr(name, sp))), _Map_keys(m)))(firstSome((name) => (_Map_has(name, m) ? None : Some(missingNameErr(name, sp))), _Map_keys(ref)))))
  .exhaustive());
const checkOrPattern = _curry(3, (alts, sp, reg) => match(altMapsFrom(alts, 0, reg, []))
  .with({ _tag: "Err" }, ({ error: e }) => Some(e))
  .with({ _tag: "Ok" }, ({ value: maps }) => match(_Array_head(maps))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp))
  .exhaustive())
  .exhaustive());
const armUnguardedCatchAll = (a) => and(isCatchAll(a.pattern), _Option_isNone(a.guard));
const guardErrs = _curry(2, (arms, listSwitch) => firstSome((a) => match(a.guard)
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: g }) => (or(isPList(a.pattern), listSwitch) ? Some(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan(g))) : None))
  .exhaustive(), arms));
const firstCatchIdx = _curry(2, (arms, i0) => { let i = i0; while (true) { const _step = match(_Array_get(i, arms))
  .with({ _tag: "None" }, () => _done(None))
  .with({ _tag: "Some" }, ({ value: a }) => (armUnguardedCatchAll(a) ? _done(Some(i)) : _recur(add(i, 1))))
  .exhaustive(); if (_step._tag === "recur") { i = _step.args[0]; continue; } return _step.value; } });
const unreachableAfterCatch = (arms) => match(firstCatchIdx(arms, 0))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: i }) => match(_Array_get(add(i, 1), arms))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: a }) => Some(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan(a.pattern))))
  .exhaustive())
  .exhaustive();
const SeqNotSeq = { _tag: "SeqNotSeq" };
const SeqTotal = { _tag: "SeqTotal" };
const SeqFail = (e) => ({ _tag: "SeqFail", e });
const checkSeqExhaustive = _curry(2, (arms, mSpan) => { const seqs = map((a) => a.pattern)(filter((a) => and(_Option_isNone(a.guard), _Option_isSome(seqElemsRest(a.pattern))))(arms)); return (eq(length(seqs), 0) ? SeqNotSeq : ((hasEmpty) => ((hasCons) => (and(hasEmpty, hasCons) ? SeqTotal : SeqFail(checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", mSpan))))(someOf((p) => match(seqElemsRest(p))
  .with((_v) => _v._tag === "Some", ({ value: [elems, rest] }) => and(eq(length(elems), 1), _Option_isSome(rest)))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), seqs)))(someOf((p) => match(seqElemsRest(p))
  .with((_v) => _v._tag === "Some", ({ value: [elems, rest] }) => and(eq(length(elems), 0), _Option_isNone(rest)))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), seqs))); });
const ctorLoop = _curry(5, (arms, i, reg, owner, covered) => match(_Array_get(i, arms))
  .with({ _tag: "None" }, () => Ok([owner, covered]))
  .with({ _tag: "Some" }, ({ value: a }) => match(a.pattern)
  .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match(_Map_get(key, reg.ctors))
  .with({ _tag: "None" }, () => Err(checkErr(`unknown constructor '${key}'`, sp)))
  .with({ _tag: "Some" }, ({ value: info }) => (not(eq(length(args), info.arity)) ? Err(checkErr(`constructor '${ctor}' expects ${show(info.arity)} arg(s), got ${show(length(args))}`, sp)) : match(owner)
  .with((_v) => _v._tag === "Some" && (({ value: own }) => not(eq(own, info.owner)))(_v), ({ value: own }) => Err(checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp)))
  .otherwise(() => ((covered2) => ctorLoop(arms, add(i, 1), reg, Some(info.owner), covered2))((and(allOf(isCatchAll, args), _Option_isNone(a.guard)) ? _Set_add(ctor, covered) : covered)))))
  .exhaustive())(patCtorKey(ctor, ns)))
  .otherwise(() => ctorLoop(arms, add(i, 1), reg, owner, covered)))
  .exhaustive());
const seqVerdict = _curry(2, (arms, mSpan) => match(checkSeqExhaustive(arms, mSpan))
  .with({ _tag: "SeqTotal" }, () => None)
  .with({ _tag: "SeqFail" }, ({ e }) => Some(e))
  .with({ _tag: "SeqNotSeq" }, () => None)
  .exhaustive());
const unguardedPatterns = (arms) => _Array_flatMap((a) => (_Option_isNone(a.guard) ? [a.pattern] : []))(arms);
const namedUnguarded = (leaves) => _Set_fromArray(_Array_flatMap((a) => (and(isPCtor(a.pattern), _Option_isNone(a.guard)) ? [ctorNameOf(a.pattern)] : []))(leaves));
const matrixVerdict = _curry(5, (arms, leaves, ownerOpt, mSpan, reg) => match(checkExhaustiveM(unguardedPatterns(arms), reg))
  .with({ _tag: "ExOk" }, () => None)
  .with({ _tag: "ExFuel" }, () => Some(checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", mSpan)))
  .with({ _tag: "ExWitness" }, ({ witness: w }) => ((own) => ((named) => ((absent) => (and(and(isWideWitnessM(w), not(eq(own, ""))), gt(length(absent), 0)) ? Some(checkErr(`non-exhaustive switch on '${own}': missing ${_Str_join(", ", absent)}`, mSpan)) : Some(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan))))(filter((c) => not(_Set_has(c, named)))(_Map_getOr([], own, reg.types))))(namedUnguarded(leaves)))(_Option_unwrapOr("", ownerOpt)))
  .exhaustive());
const leavesOfArm = (a) => match(a.pattern)
  .with({ _tag: "POr" }, ({ alts }) => map((alt) => ({ pattern: alt, guard: a.guard }))(alts))
  .otherwise(() => [{ pattern: a.pattern, guard: a.guard }]);
const checkMatch = _curry(3, (arms, mSpan, reg) => match(firstSome((a) => checkPattern(a.pattern, reg, true), arms))
  .with({ _tag: "Some" }, ({ value: e }) => Some(e))
  .with({ _tag: "None" }, () => ((listSwitch) => match(guardErrs(arms, listSwitch))
  .with({ _tag: "Some" }, ({ value: e }) => Some(e))
  .with({ _tag: "None" }, () => match(unreachableAfterCatch(arms))
  .with({ _tag: "Some" }, ({ value: e }) => Some(e))
  .with({ _tag: "None" }, () => ((hasCatchAll) => ((leaves) => ((ctorArms) => (someOf((a) => isPList(a.pattern), arms) ? (hasCatchAll ? None : seqVerdict(arms, mSpan)) : match(ctorLoop(ctorArms, 0, reg, None, _Set_fromArray([])))
  .with({ _tag: "Err" }, ({ error: e }) => Some(e))
  .with((_v) => _v._tag === "Ok", ({ value: [ownerOpt, ] }) => matrixVerdict(arms, leaves, ownerOpt, mSpan, reg))
  .exhaustive()))(filter((a) => isPCtor(a.pattern))(leaves)))(_Array_flatMap(leavesOfArm)(arms)))(someOf(armUnguardedCatchAll, arms)))
  .exhaustive())
  .exhaustive())(someOf((a) => and(isPList(a.pattern), not(isCatchAll(a.pattern))), arms)))
  .exhaustive());
const checkExpr = _curry(2, (e, reg) => match(e)
  .with({ _tag: "ENum" }, () => None)
  .with({ _tag: "EUnit" }, () => None)
  .with({ _tag: "EBool" }, () => None)
  .with({ _tag: "EStr" }, () => None)
  .with({ _tag: "ERef" }, () => None)
  .with({ _tag: "ECall" }, ({ fn, args }) => _Option_orElse(firstSome((a) => checkExpr(a, reg), args))(checkExpr(fn, reg)))
  .with({ _tag: "ELambda" }, ({ body }) => checkExpr(body, reg))
  .with({ _tag: "ELetIn" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg))(checkExpr(value, reg)))
  .with({ _tag: "ELetBind" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg))(checkExpr(value, reg)))
  .with({ _tag: "EPipe" }, ({ left, right }) => _Option_orElse(checkExpr(right, reg))(checkExpr(left, reg)))
  .with({ _tag: "EDo" }, ({ exprs }) => firstSome((x) => checkExpr(x, reg), exprs))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Option_orElse(checkExpr(elseE, reg))(_Option_orElse(checkExpr(thenE, reg))(checkExpr(cond, reg))))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms, span: sp }) => _Option_orElse(checkMatch(arms, sp, reg))(_Option_orElse(firstSome((a) => _Option_orElse(checkExpr(a.body, reg))(match(a.guard)
  .with({ _tag: "Some" }, ({ value: g }) => checkExpr(g, reg))
  .with({ _tag: "None" }, () => None)
  .exhaustive()), arms))(checkExpr(scrutinee, reg))))
  .with({ _tag: "ERecord" }, ({ fields, spread }) => _Option_orElse(firstSome((f) => checkExpr(f.value, reg), fields))(match(spread)
  .with({ _tag: "Some" }, ({ value: s }) => checkExpr(s, reg))
  .with({ _tag: "None" }, () => None)
  .exhaustive()))
  .with({ _tag: "EField" }, ({ target }) => checkExpr(target, reg))
  .with({ _tag: "ELoop" }, ({ params, body }) => _Option_orElse(checkExpr(body, reg))(firstSome((p) => checkExpr(p.init, reg), params)))
  .with({ _tag: "ERecur" }, ({ args }) => firstSome((a) => checkExpr(a, reg), args))
  .with({ _tag: "ETuple" }, ({ elements }) => firstSome((el) => checkExpr(el, reg), elements))
  .with({ _tag: "EArr" }, ({ elements }) => firstSome((el) => checkExpr(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive(), reg), elements))
  .with({ _tag: "EList" }, ({ elements }) => firstSome((el) => checkExpr(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive(), reg), elements))
  .with({ _tag: "ESet" }, ({ elements }) => firstSome((el) => checkExpr(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive(), reg), elements))
  .with({ _tag: "EMap" }, ({ entries }) => firstSome((en) => _Option_orElse(checkExpr(en.value, reg))(checkExpr(en.key, reg)), entries))
  .with({ _tag: "EInterp" }, ({ parts }) => firstSome((p) => match(p)
  .with({ _tag: "IPLit" }, () => None)
  .with({ _tag: "IPExpr" }, ({ expr: ex }) => checkExpr(ex, reg))
  .exhaustive(), parts))
  .exhaustive());
const reservedNames = ["Array", "List", "Set", "Map", "Option", "Result", "Str"];
const redeclarableTypes = ["Option", "Result"];
const reservedErr = _curry(2, (name, sp) => checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp));
const checkReservedNames = (stmts) => firstSome((s) => match(s)
  .with({ _tag: "SType" }, ({ name, span: sp }) => (_Array_contains(name, redeclarableTypes) ? None : (_Array_contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None)))
  .with({ _tag: "SLet" }, ({ name, span: sp }) => (_Array_contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None))
  .with({ _tag: "SExtern" }, ({ name, span: sp }) => (_Array_contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None))
  .with({ _tag: "SImport" }, ({ names }) => firstSome((n) => (_Array_contains(n.name, reservedNames) ? Some(checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)) : None), names))
  .with({ _tag: "SImportNs" }, ({ alias }) => (_Array_contains(alias.name, reservedNames) ? Some(checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)) : None))
  .with({ _tag: "SError" }, () => None)
  .with({ _tag: "SExpr" }, () => None)
  .exhaustive(), stmts);
const isUpperStart = (s) => match(_Str_codeAt(0, s))
  .with({ _tag: "Some" }, ({ value: c }) => and(gte(c, 65), lte(c, 90)))
  .with({ _tag: "None" }, () => false)
  .exhaustive();
const strayTypeVar = _curry(2, (te, params) => match(te)
  .with({ _tag: "TyName" }, ({ name, span: sp }) => (or(isUpperStart(name), or(_Array_contains(name, primTypeNames), _Array_contains(name, params))) ? None : Some([name, sp])))
  .with({ _tag: "TyArrow" }, ({ from, to }) => _Option_orElse(strayTypeVar(to, params))(strayTypeVar(from, params)))
  .with({ _tag: "TyApp" }, ({ args }) => firstSome((a) => strayTypeVar(a, params), args))
  .with({ _tag: "TyTuple" }, ({ elems }) => firstSome((el) => strayTypeVar(el, params), elems))
  .with({ _tag: "TyList" }, ({ elem }) => strayTypeVar(elem, params))
  .with({ _tag: "TyQual" }, ({ args }) => firstSome((a) => strayTypeVar(a, params), args))
  .with({ _tag: "TyLit" }, () => None)
  .with({ _tag: "TyUnion" }, ({ members }) => firstSome((m) => strayTypeVar(m, params), members))
  .exhaustive());
const checkCtorFieldVars = (stmts) => firstSome((s) => match(s)
  .with({ _tag: "SType" }, ({ name, params, ctors }) => firstSome((c) => firstSome((f) => match(strayTypeVar(f.fieldType, params))
  .with((_v) => _v._tag === "Some", ({ value: [vn, vsp] }) => Some(checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join(" ", _Array_append(vn, params))} = ...`, vsp)))
  .with({ _tag: "None" }, () => None)
  .exhaustive(), c.fields), ctors))
  .otherwise(() => None), stmts);
const qualRefsFrom = (te) => match(te)
  .with({ _tag: "TyName" }, () => [])
  .with({ _tag: "TyArrow" }, ({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)])
  .with({ _tag: "TyApp" }, ({ args }) => _Array_flatMap(qualRefsFrom, args))
  .with({ _tag: "TyTuple" }, ({ elems }) => _Array_flatMap(qualRefsFrom, elems))
  .with({ _tag: "TyList" }, ({ elem }) => qualRefsFrom(elem))
  .with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span: sp }) => [{ alias: alias, name: name, nameSpan: nameSpan, qualSpan: sp }, ..._Array_flatMap(qualRefsFrom, args)])
  .with({ _tag: "TyLit" }, () => [])
  .with({ _tag: "TyUnion" }, ({ members }) => _Array_flatMap(qualRefsFrom, members))
  .exhaustive();
const writtenTypeExprs = (stmts) => _Array_flatMap((s) => match(s)
  .with({ _tag: "SExtern" }, ({ typeExpr: te }) => [te])
  .with({ _tag: "SLet" }, ({ annot }) => match(annot)
  .with({ _tag: "Some" }, ({ value: te }) => [te])
  .with({ _tag: "None" }, () => [])
  .exhaustive())
  .with({ _tag: "SType" }, ({ ctors, alias, aliasType }) => [..._Array_flatMap((c) => map((f) => f.fieldType, c.fields), ctors), ...match(alias)
  .with({ _tag: "Some" }, ({ value: fields }) => map((f) => f.fieldType, fields))
  .with({ _tag: "None" }, () => [])
  .exhaustive(), ...match(aliasType)
  .with({ _tag: "Some" }, ({ value: te }) => [te])
  .with({ _tag: "None" }, () => [])
  .exhaustive()])
  .otherwise(() => []), stmts);

const emptyQuals = new Map([]);
const checkQualifiedTypeNames = _curry(2, (stmts, quals) => { const nsAliases = _Set_fromArray(_Array_flatMap((s) => match(s)
  .with({ _tag: "SImportNs" }, ({ alias }) => [alias.name])
  .otherwise(() => []), stmts)); return firstSome((q) => (_Set_has(q.alias, nsAliases) ? match(_Map_get(q.alias, quals))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: dep }) => (_Set_has(q.name, dep.types) ? None : Some(checkErr(`module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`, q.nameSpan))))
  .exhaustive() : Some(checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`, q.qualSpan))), _Array_flatMap(qualRefsFrom, writtenTypeExprs(stmts))); });
const mergeMissing = _curry(3, (keys, from, into) => match(keys)
  .with((_v) => _v.length === 0, () => into)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => match(_Map_get(k, from))
  .with({ _tag: "Some" }, ({ value: v }) => mergeMissing(rest, from, (_Map_has(k, into) ? into : _Map_set(k, v, into))))
  .with({ _tag: "None" }, () => mergeMissing(rest, from, into))
  .exhaustive())
  .exhaustive());
export const checkWith = _curry(3, (stmts, imported, quals) => match(checkReservedNames(stmts))
  .with({ _tag: "Some" }, ({ value: e }) => Err(e))
  .with({ _tag: "None" }, () => match(checkCtorFieldVars(stmts))
  .with({ _tag: "Some" }, ({ value: e }) => Err(e))
  .with({ _tag: "None" }, () => match(checkQualifiedTypeNames(stmts, quals))
  .with({ _tag: "Some" }, ({ value: e }) => Err(e))
  .with({ _tag: "None" }, () => _Result_flatMap((reg0) => ((reg) => match(firstSome((s) => match(s)
  .with({ _tag: "SLet" }, ({ value }) => checkExpr(value, reg))
  .with({ _tag: "SExpr" }, ({ value }) => checkExpr(value, reg))
  .otherwise(() => None), stmts))
  .with({ _tag: "Some" }, ({ value: e }) => Err(e))
  .with({ _tag: "None" }, () => Ok(stmts))
  .exhaustive())({ ctors: mergeMissing(_Map_keys(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys(imported.types), imported.types, reg0.types) }))(buildRegistry(stmts)))
  .exhaustive())
  .exhaustive())
  .exhaustive());
export const check = (stmts) => checkWith(stmts, { ctors: new Map([]), types: new Map([]) }, emptyQuals);
