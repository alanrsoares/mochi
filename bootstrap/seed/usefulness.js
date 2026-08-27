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
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));
const reduce = _curry(3, (f, init, xs) => xs.reduce((acc, x) => f(acc)(x), init));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Option_isSome = (o) => o._tag === "Some";
const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));
const _Array_take = _curry(2, (n, xs) => xs.slice(0, n));
const _Array_drop = _curry(2, (n, xs) => xs.slice(n));
const _Array_tail = (xs) => xs.slice(1);
const _Array_contains = _curry(2, (x, xs) => xs.some((y) => eq(x, y)));
const _Str_concat = _curry(2, (a, b) => a + b);
const _Str_join = _curry(2, (sep, xs) => xs.join(sep));
const _Str_endsWith = _curry(2, (p, s) => s.endsWith(p));

import * as Ast from "./ast.js";
const MWild = { _tag: "MWild" };
const MCtor = _curry(2, (name, args) => ({ _tag: "MCtor", name, args }));
const MBool = (value) => ({ _tag: "MBool", value });
const MNum = (value) => ({ _tag: "MNum", value });
const MStr = (value) => ({ _tag: "MStr", value });
const MTuple = (elems) => ({ _tag: "MTuple", elems });
const MRecord = _curry(2, (labels, pats) => ({ _tag: "MRecord", labels, pats }));
const MArr = _curry(2, (elems, rest) => ({ _tag: "MArr", elems, rest }));
const MOpaque = { _tag: "MOpaque" };
const HCtor = (name) => ({ _tag: "HCtor", name });
const HBool = (value) => ({ _tag: "HBool", value });
const HNum = (value) => ({ _tag: "HNum", value });
const HStr = (value) => ({ _tag: "HStr", value });
const HTuple = (arity) => ({ _tag: "HTuple", arity });
const HRecord = { _tag: "HRecord" };
const HArr = (len) => ({ _tag: "HArr", len });
const UNone = (fuel) => ({ _tag: "UNone", fuel });
const USome = _curry(2, (row, fuel) => ({ _tag: "USome", row, fuel }));
const UFuel = { _tag: "UFuel" };
export const ExOk = { _tag: "ExOk" };
export const ExWitness = (witness) => ({ _tag: "ExWitness", witness });
export const ExFuel = { _tag: "ExFuel" };
const mWilds = (n) => (lte(n, 0) ? [] : _Array_prepend(MWild, mWilds(sub(n, 1))));
const isWildMP = (mp) => match(mp)
  .with({ _tag: "MWild" }, () => true)
  .otherwise(() => false);
export const explodePat = (p) => match(p)
  .with({ _tag: "PAs" }, ({ pat }) => explodePat(pat))
  .with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(explodePat)(alts))
  .otherwise(() => [p]);
const toMP = (p) => match(p)
  .with({ _tag: "PAs" }, ({ pat }) => toMP(pat))
  .with({ _tag: "PWild" }, () => MWild)
  .with({ _tag: "PUnit" }, () => MWild)
  .with({ _tag: "PBind" }, () => MWild)
  .with({ _tag: "PLit" }, ({ value: v }) => MNum(v))
  .with({ _tag: "PBool" }, ({ value: v }) => MBool(v))
  .with({ _tag: "PStr" }, ({ value: v }) => MStr(v))
  .with({ _tag: "PTuple" }, ({ elems }) => MTuple(map(toMP)(elems)))
  .with({ _tag: "PCtor" }, ({ ctor: name, args }) => MCtor(name, map(toMP)(args)))
  .with({ _tag: "PRecord" }, ({ fields }) => MRecord(map((f) => f.label)(fields), map((f) => toMP(f.pat))(fields)))
  .with({ _tag: "PArr" }, ({ elems, rest }) => MArr(map(toMP)(elems), _Option_isSome(rest)))
  .with({ _tag: "PList" }, () => MOpaque)
  .with({ _tag: "POr" }, () => MOpaque)
  .exhaustive();
const headOf = (mp) => match(mp)
  .with({ _tag: "MWild" }, () => None)
  .with({ _tag: "MOpaque" }, () => None)
  .with({ _tag: "MCtor" }, ({ name: n }) => Some(HCtor(n)))
  .with({ _tag: "MBool" }, ({ value: v }) => Some(HBool(v)))
  .with({ _tag: "MNum" }, ({ value: v }) => Some(HNum(v)))
  .with({ _tag: "MStr" }, ({ value: v }) => Some(HStr(v)))
  .with({ _tag: "MTuple" }, ({ elems }) => Some(HTuple(length(elems))))
  .with({ _tag: "MRecord" }, () => Some(HRecord))
  .with({ _tag: "MArr" }, ({ elems }) => Some(HArr(length(elems))))
  .exhaustive();
const colOf = (m) => _Array_flatMap((row) => match(_Array_head(row))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: hd }) => [hd])
  .exhaustive())(m);
const headsOf = (col) => _Array_flatMap((mp) => match(headOf(mp))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: h }) => [h])
  .exhaustive())(col);
const addLabel = _curry(2, (acc, l) => (_Array_contains(l, acc) ? acc : _Array_append(l, acc)));
const labelsOfMP = _curry(2, (acc, mp) => match(mp)
  .with({ _tag: "MRecord" }, ({ labels: ls }) => reduce(addLabel, acc, ls))
  .otherwise(() => acc));
const recordLabelsOf = (col) => reduce(labelsOfMP, [], col);
const indexOfLabel = _curry(3, (l, labels, i) => match(_Array_get(i, labels))
  .with({ _tag: "None" }, () => sub(0, 1))
  .with({ _tag: "Some" }, ({ value: x }) => (eq(x, l) ? i : indexOfLabel(l, labels, add(i, 1))))
  .exhaustive());
const fieldOf = _curry(3, (l, labels, pats) => { const i = indexOfLabel(l, labels, 0); return (lt(i, 0) ? MWild : _Option_unwrapOr(MWild, _Array_get(i, pats))); });

const arrShapeStep = _curry(2, (acc, mp) => match(mp)
  .with({ _tag: "MArr" }, ({ elems, rest }) => ((n) => (rest ? { fixed: acc.fixed, restFrom: match(acc.restFrom)
  .with({ _tag: "None" }, () => Some(n))
  .with({ _tag: "Some" }, ({ value: m }) => Some((lt(m, n) ? m : n)))
  .exhaustive() } : { fixed: (_Array_contains(n, acc.fixed) ? acc.fixed : _Array_append(n, acc.fixed)), restFrom: acc.restFrom }))(length(elems)))
  .otherwise(() => acc));
const arrShapeOf = (col) => reduce(arrShapeStep, { fixed: [], restFrom: None }, col);
const rangeCovered = _curry(3, (shape, i, n) => (gte(i, n) ? true : and(_Array_contains(i, shape.fixed), rangeCovered(shape, add(i, 1), n))));
const arrComplete = (shape) => match(shape.restFrom)
  .with({ _tag: "None" }, () => false)
  .with({ _tag: "Some" }, ({ value: r }) => rangeCovered(shape, 0, r))
  .exhaustive();
const arrMissingLen = _curry(2, (shape, n) => (and(not(_Array_contains(n, shape.fixed)), match(shape.restFrom)
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, ({ value: r }) => lt(n, r))
  .exhaustive()) ? n : arrMissingLen(shape, add(n, 1))));
const rangeArr = _curry(2, (i, top) => (gt(i, top) ? [] : _Array_prepend(i, rangeArr(add(i, 1), top))));
const arrLengths = (shape) => { const top = reduce(_curry(2, (a, x) => (gt(x, a) ? x : a)), _Option_unwrapOr(0, shape.restFrom), shape.fixed); return rangeArr(0, top); };
const specializeRow = _curry(3, (h, mp, labels) => match(h)
  .with({ _tag: "HCtor" }, ({ name }) => match(mp)
  .with({ _tag: "MCtor" }, ({ name: n, args }) => (eq(n, name) ? Some(args) : None))
  .otherwise(() => None))
  .with({ _tag: "HBool" }, ({ value: v }) => match(mp)
  .with({ _tag: "MBool" }, ({ value: b }) => (eq(b, v) ? Some([]) : None))
  .otherwise(() => None))
  .with({ _tag: "HNum" }, ({ value: v }) => match(mp)
  .with({ _tag: "MNum" }, ({ value: x }) => (eq(x, v) ? Some([]) : None))
  .otherwise(() => None))
  .with({ _tag: "HStr" }, ({ value: v }) => match(mp)
  .with({ _tag: "MStr" }, ({ value: x }) => (eq(x, v) ? Some([]) : None))
  .otherwise(() => None))
  .with({ _tag: "HTuple" }, () => match(mp)
  .with({ _tag: "MTuple" }, ({ elems }) => Some(elems))
  .otherwise(() => None))
  .with({ _tag: "HRecord" }, () => match(mp)
  .with({ _tag: "MRecord" }, ({ labels: ls, pats: ps }) => Some(map((l) => fieldOf(l, ls, ps))(labels)))
  .otherwise(() => None))
  .with({ _tag: "HArr" }, ({ len }) => match(mp)
  .with({ _tag: "MArr" }, ({ elems, rest }) => ((k) => (rest ? (lte(k, len) ? Some(_Array_concat(elems, mWilds(sub(len, k)))) : None) : (eq(k, len) ? Some(elems) : None)))(length(elems)))
  .otherwise(() => None))
  .exhaustive());
const specializeOne = _curry(4, (h, arity, labels, row) => match(_Array_head(row))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: hd }) => ((rest) => (isWildMP(hd) ? [_Array_concat(mWilds(arity), rest)] : match(specializeRow(h, hd, labels))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: sub }) => [_Array_concat(sub, rest)])
  .exhaustive()))(_Array_tail(row)))
  .exhaustive());
const specializeM = _curry(4, (m, h, arity, labels) => _Array_flatMap((row) => specializeOne(h, arity, labels, row))(m));
const defaultM = (m) => _Array_flatMap((row) => match(_Array_head(row))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: hd }) => (isWildMP(hd) ? [_Array_tail(row)] : []))
  .exhaustive())(m);
const rebuild = _curry(3, (h, args, labels) => match(h)
  .with({ _tag: "HCtor" }, ({ name }) => MCtor(name, args))
  .with({ _tag: "HTuple" }, () => MTuple(args))
  .with({ _tag: "HRecord" }, () => MRecord(labels, args))
  .with({ _tag: "HArr" }, () => MArr(args, false))
  .with({ _tag: "HBool" }, ({ value: v }) => MBool(v))
  .with({ _tag: "HNum" }, ({ value: v }) => MNum(v))
  .with({ _tag: "HStr" }, ({ value: v }) => MStr(v))
  .exhaustive());
const takenNums = (heads) => _Array_flatMap((h) => match(h)
  .with({ _tag: "HNum" }, ({ value: v }) => [v])
  .otherwise(() => []))(heads);
const freshNum = _curry(2, (taken, i) => (_Array_contains(i, taken) ? freshNum(taken, add(i, 1)) : i));
const takenStrs = (heads) => _Array_flatMap((h) => match(h)
  .with({ _tag: "HStr" }, ({ value: v }) => [v])
  .otherwise(() => []))(heads);
const starsOf = (n) => (lte(n, 0) ? "" : _Str_concat("*", starsOf(sub(n, 1))));
const freshStr = _curry(2, (taken, i) => { const s = starsOf(i); return (_Array_contains(s, taken) ? freshStr(taken, add(i, 1)) : s); });
const ctorNames = (heads) => _Array_flatMap((h) => match(h)
  .with({ _tag: "HCtor" }, ({ name: n }) => [n])
  .otherwise(() => []))(heads);
const boolVals = (heads) => _Array_flatMap((h) => match(h)
  .with({ _tag: "HBool" }, ({ value: v }) => [v])
  .otherwise(() => []))(heads);
const ctorInfoSuffixed = _curry(3, (keys, reg, n) => match(keys)
  .with((_v) => _v.length === 0, () => None)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => (_Str_endsWith(`.${n}`, k) ? _Map_get(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n)))
  .exhaustive());
const ctorInfoOf = _curry(2, (reg, n) => match(_Map_get(n, reg.ctors))
  .with({ _tag: "Some" }, ({ value: info }) => Some(info))
  .with({ _tag: "None" }, () => ctorInfoSuffixed(_Map_keys(reg.ctors), reg, n))
  .exhaustive());
const arityOfCtor = _curry(2, (reg, n) => match(ctorInfoOf(reg, n))
  .with({ _tag: "None" }, () => 0)
  .with({ _tag: "Some" }, ({ value: info }) => info.arity)
  .exhaustive());
const ownerOfCtor = _curry(2, (reg, n) => match(ctorInfoOf(reg, n))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: info }) => Some(info.owner))
  .exhaustive());
const allNamesIn = _curry(2, (all, names) => reduce(_curry(2, (acc, n) => and(acc, _Array_contains(n, names))), true, all));
const useful = _curry(4, (m, width, reg, fuel) => (lte(fuel, 0) ? UFuel : (eq(width, 0) ? (eq(length(m), 0) ? USome([], sub(fuel, 1)) : UNone(sub(fuel, 1))) : (eq(length(m), 0) ? USome(mWilds(width), sub(fuel, 1)) : usefulSplit(m, width, reg, sub(fuel, 1))))));
const usefulSplit = _curry(4, (m, width, reg, fuel) => { const col = colOf(m); const heads = headsOf(col); return match(_Array_head(heads))
  .with({ _tag: "None" }, () => prependWitness(MWild, useful(defaultM(m), sub(width, 1), reg, fuel)))
  .with({ _tag: "Some" }, ({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel))
  .exhaustive(); });
const prependWitness = _curry(2, (mp, r) => match(r)
  .with({ _tag: "UFuel" }, () => UFuel)
  .with({ _tag: "UNone" }, ({ fuel: f }) => UNone(f))
  .with({ _tag: "USome" }, ({ row, fuel: f }) => USome(_Array_prepend(mp, row), f))
  .exhaustive());
const tryHeads = _curry(8, (m, heads, arities, labels, width, reg, fuel, i) => match(_Array_get(i, heads))
  .with({ _tag: "None" }, () => UNone(fuel))
  .with({ _tag: "Some" }, ({ value: h }) => ((arity) => match(useful(specializeM(m, h, arity, labels), sub(add(arity, width), 1), reg, fuel))
  .with({ _tag: "UFuel" }, () => UFuel)
  .with({ _tag: "UNone" }, ({ fuel: f2 }) => tryHeads(m, heads, arities, labels, width, reg, f2, add(i, 1)))
  .with({ _tag: "USome" }, ({ row, fuel: f2 }) => USome(_Array_prepend(rebuild(h, _Array_take(arity, row), labels), _Array_drop(arity, row)), f2))
  .exhaustive())(_Option_unwrapOr(0, _Array_get(i, arities))))
  .exhaustive());
const usefulHead = _curry(7, (m, col, heads, h0, width, reg, fuel) => match(h0)
  .with({ _tag: "HTuple" }, ({ arity }) => tryHeads(m, [HTuple(arity)], [arity], [], width, reg, fuel, 0))
  .with({ _tag: "HRecord" }, () => ((labels) => tryHeads(m, [HRecord], [length(labels)], labels, width, reg, fuel, 0))(recordLabelsOf(col)))
  .with({ _tag: "HCtor" }, () => usefulCtor(m, heads, width, reg, fuel))
  .with({ _tag: "HBool" }, () => usefulBool(m, heads, width, reg, fuel))
  .with({ _tag: "HArr" }, () => usefulArr(m, col, width, reg, fuel))
  .with({ _tag: "HNum" }, () => prependWitness(MNum(freshNum(takenNums(heads), 0)), useful(defaultM(m), sub(width, 1), reg, fuel)))
  .with({ _tag: "HStr" }, () => prependWitness(MStr(freshStr(takenStrs(heads), 0)), useful(defaultM(m), sub(width, 1), reg, fuel)))
  .exhaustive());
const usefulCtor = _curry(5, (m, heads, width, reg, fuel) => { const names = ctorNames(heads); const ownerOpt = match(_Array_head(names))
  .with({ _tag: "None" }, () => None)
  .with({ _tag: "Some" }, ({ value: n }) => ownerOfCtor(reg, n))
  .exhaustive(); const all = match(ownerOpt)
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: o }) => _Map_getOr([], o, reg.types))
  .exhaustive(); return (and(gt(length(all), 0), allNamesIn(all, names)) ? tryHeads(m, map((n) => HCtor(n))(all), map((n) => arityOfCtor(reg, n))(all), [], width, reg, fuel, 0) : prependWitness(match(_Array_head(filter((n) => not(_Array_contains(n, names)))(all)))
  .with({ _tag: "None" }, () => MWild)
  .with({ _tag: "Some" }, ({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n))))
  .exhaustive(), useful(defaultM(m), sub(width, 1), reg, fuel))); });
const usefulBool = _curry(5, (m, heads, width, reg, fuel) => { const vs = boolVals(heads); const hasTrue = _Array_contains(true, vs); return (and(hasTrue, _Array_contains(false, vs)) ? tryHeads(m, [HBool(true), HBool(false)], [0, 0], [], width, reg, fuel, 0) : prependWitness(MBool(not(hasTrue)), useful(defaultM(m), sub(width, 1), reg, fuel))); });
const usefulArr = _curry(5, (m, col, width, reg, fuel) => { const shape = arrShapeOf(col); return (arrComplete(shape) ? ((lens) => tryHeads(m, map((n) => HArr(n))(lens), lens, [], width, reg, fuel, 0))(arrLengths(shape)) : prependWitness(MArr(mWilds(arrMissingLen(shape, 0)), false), useful(defaultM(m), sub(width, 1), reg, fuel))); });
const showFields = _curry(3, (labels, pats, i) => match(_Array_get(i, labels))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: l }) => _Array_prepend(`${l}: ${showWitness(_Option_unwrapOr(MWild, _Array_get(i, pats)))}`, showFields(labels, pats, add(i, 1))))
  .exhaustive());
export const showWitness = (mp) => match(mp)
  .with({ _tag: "MWild" }, () => "_")
  .with({ _tag: "MOpaque" }, () => "_")
  .with({ _tag: "MBool" }, ({ value: v }) => show(v))
  .with({ _tag: "MNum" }, ({ value: v }) => show(v))
  .with({ _tag: "MStr" }, ({ value: v }) => show(v))
  .with({ _tag: "MCtor" }, ({ name: n, args }) => (eq(length(args), 0) ? n : `${n}(${_Str_join(", ", map(showWitness)(args))})`))
  .with({ _tag: "MTuple" }, ({ elems }) => `(${_Str_join(", ", map(showWitness)(elems))})`)
  .with({ _tag: "MRecord" }, ({ labels, pats }) => `{ ${_Str_join(", ", showFields(labels, pats, 0))} }`)
  .with({ _tag: "MArr" }, ({ elems, rest }) => `[${_Str_join(", ", _Array_concat(map(showWitness)(elems), (rest ? ["..."] : [])))}]`)
  .exhaustive();
export const isWideWitnessM = (mp) => match(mp)
  .with({ _tag: "MWild" }, () => true)
  .with({ _tag: "MCtor" }, ({ args }) => reduce(_curry(2, (acc, a) => and(acc, isWildMP(a))), true, args))
  .otherwise(() => false);
export const checkExhaustiveM = _curry(2, (patterns, reg) => { const rows = _Array_flatMap((p) => map((alt) => [toMP(alt)])(explodePat(p)))(patterns); return match(useful(rows, 1, reg, 20000))
  .with({ _tag: "UFuel" }, () => ExFuel)
  .with({ _tag: "UNone" }, () => ExOk)
  .with({ _tag: "USome" }, ({ row }) => ExWitness(_Option_unwrapOr(MWild, _Array_head(row))))
  .exhaustive(); });
