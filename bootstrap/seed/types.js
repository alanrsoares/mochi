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
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Str_join = _curry(2, (sep, xs) => xs.join(sep));

export const TyVar = (id) => ({ _tag: "TyVar", id });
export const TyCon = _curry(2, (name, args) => ({ _tag: "TyCon", name, args }));
export const TyFn = _curry(2, (from, to) => ({ _tag: "TyFn", from, to }));
export const TyRecord = (row) => ({ _tag: "TyRecord", row });
export const TySingleton = _curry(2, (base, value) => ({ _tag: "TySingleton", base, value }));
export const TyOneOf = (members) => ({ _tag: "TyOneOf", members });
export const RowEmpty = { _tag: "RowEmpty" };
export const RowVar = (id) => ({ _tag: "RowVar", id });
export const RowExtend = _curry(3, (label, fieldType, rest) => ({ _tag: "RowExtend", label, fieldType, rest }));
export const tVar = (id) => TyVar(id);
export const tCon = _curry(2, (name, args) => TyCon(name, args));
export const tArrow = _curry(2, (fromT, toT) => TyFn(fromT, toT));
export const tRecord = (row) => TyRecord(row);
export const tPrim = (name) => TyCon(name, []);
export const tLit = (value) => TySingleton("string", value);
const typeEq = _curry(2, (a, b) => match(a)
  .with({ _tag: "TyVar" }, ({ id: aid }) => match(b)
  .with({ _tag: "TyVar" }, ({ id: bid }) => eq(aid, bid))
  .otherwise(() => false))
  .with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match(b)
  .with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => and(and(eq(aname, bname), eq(length(aargs), length(bargs))), typeEqList(aargs, bargs, 0)))
  .otherwise(() => false))
  .with({ _tag: "TyFn" }, ({ from: af, to: at }) => match(b)
  .with({ _tag: "TyFn" }, ({ from: bf, to: bt }) => and(typeEq(af, bf), typeEq(at, bt)))
  .otherwise(() => false))
  .with({ _tag: "TyRecord" }, ({ row: arow }) => match(b)
  .with({ _tag: "TyRecord" }, ({ row: brow }) => rowEq(arow, brow))
  .otherwise(() => false))
  .with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match(b)
  .with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => and(eq(abase, bbase), eq(aval, bval)))
  .otherwise(() => false))
  .with({ _tag: "TyOneOf" }, ({ members: am }) => match(b)
  .with({ _tag: "TyOneOf" }, ({ members: bm }) => and(eq(length(am), length(bm)), allMembersIn(am, bm, 0)))
  .otherwise(() => false))
  .exhaustive());
const typeEqList = _curry(3, (as_, bs, i) => match(_Array_get(i, as_))
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, ({ value: a }) => match(_Array_get(i, bs))
  .with({ _tag: "None" }, () => false)
  .with({ _tag: "Some" }, ({ value: b }) => and(typeEq(a, b), typeEqList(as_, bs, add(i, 1))))
  .exhaustive())
  .exhaustive());
const memberEqIn = _curry(3, (t, xs, i) => match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => false)
  .with({ _tag: "Some" }, ({ value: x }) => (typeEq(t, x) ? true : memberEqIn(t, xs, add(i, 1))))
  .exhaustive());
const allMembersIn = _curry(3, (am, bm, i) => match(_Array_get(i, am))
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, ({ value: m }) => and(memberEqIn(m, bm, 0), allMembersIn(am, bm, add(i, 1))))
  .exhaustive());
const rowEq = _curry(2, (a, b) => match(a)
  .with({ _tag: "RowEmpty" }, () => match(b)
  .with({ _tag: "RowEmpty" }, () => true)
  .otherwise(() => false))
  .with({ _tag: "RowVar" }, ({ id: aid }) => match(b)
  .with({ _tag: "RowVar" }, ({ id: bid }) => eq(aid, bid))
  .otherwise(() => false))
  .with({ _tag: "RowExtend" }, ({ label: al, fieldType: at, rest: ar }) => match(b)
  .with({ _tag: "RowExtend" }, ({ label: bl, fieldType: bt, rest: br }) => and(and(eq(al, bl), typeEq(at, bt)), rowEq(ar, br)))
  .otherwise(() => false))
  .exhaustive());
const flattenUnionFrom = _curry(3, (members, acc, i) => match(_Array_get(i, members))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: t }) => match(t)
  .with({ _tag: "TyOneOf" }, ({ members: ms }) => flattenUnionFrom(members, flattenUnionFrom(ms, acc, 0), add(i, 1)))
  .otherwise(() => flattenUnionFrom(members, (memberEqIn(t, acc, 0) ? acc : _Array_append(t, acc)), add(i, 1))))
  .exhaustive());
export const tUnion = (members) => { const flat = flattenUnionFrom(members, [], 0); return match(flat)
  .with((_v) => _v.length === 0, () => tPrim("string"))
  .with((_v) => _v.length === 1, ([only]) => only)
  .otherwise(() => TyOneOf(flat)); };
const TUPLE = "tuple";
export const tTuple = (elems) => TyCon(TUPLE, elems);
export const UNIT = "unit";
export const tUnit = TyCon(UNIT, []);
export const isUnit = (t) => match(t)
  .with({ _tag: "TyCon" }, ({ name, args }) => and(eq(name, UNIT), eq(length(args), 0)))
  .otherwise(() => false);
export const rVar = (id) => RowVar(id);
export const rExtend = _curry(3, (label, fieldType, rest) => RowExtend(label, fieldType, rest));
const showTypeArgs = (args) => _Str_join(", ", map(showType)(args));
export const showType = (t) => match(t)
  .with({ _tag: "TyVar" }, ({ id }) => `'t${show(id)}`)
  .with({ _tag: "TyCon" }, ({ name, args }) => match(args)
  .with((_v) => _v.length === 1 && (([elem]) => eq(name, "Array"))(_v), ([elem]) => `[${showType(elem)}]`)
  .with((_v) => _v.length === 0 && (eq(name, UNIT)), () => "()")
  .otherwise(() => (eq(name, TUPLE) ? `(${showTypeArgs(args)})` : (eq(length(args), 0) ? name : `${name}<${showTypeArgs(args)}>`))))
  .with({ _tag: "TyFn" }, ({ from, to }) => ((fromS) => `${fromS} -> ${showType(to)}`)(match(from)
  .with({ _tag: "TyFn" }, () => `(${showType(from)})`)
  .otherwise(() => showType(from))))
  .with({ _tag: "TyRecord" }, ({ row }) => showRow(row))
  .with({ _tag: "TySingleton" }, ({ base, value }) => (eq(base, "string") ? show(value) : value))
  .with({ _tag: "TyOneOf" }, ({ members }) => _Str_join(" | ", map(showType)(members)))
  .exhaustive();
const showRowFields = (row) => match(row)
  .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => (([fields, tailId]) => [_Array_prepend(`${label}: ${showType(fieldType)}`, fields), tailId])(showRowFields(rest)))
  .with({ _tag: "RowVar" }, ({ id }) => [[], Some(id)])
  .with({ _tag: "RowEmpty" }, () => [[], None])
  .exhaustive();
const showRow = (row) => (([fields, tailId]) => { const tail = match(tailId)
  .with({ _tag: "Some" }, ({ value: id }) => `${(eq(length(fields), 0) ? "" : " ")}| 'r${show(id)}`)
  .with({ _tag: "None" }, () => "")
  .exhaustive(); return (and(eq(length(fields), 0), eq(tail, "")) ? "{}" : `{ ${_Str_join(", ", fields)}${tail} }`); })(showRowFields(row));
const someOfFrom = _curry(3, (f, xs, i) => match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => false)
  .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? true : someOfFrom(f, xs, add(i, 1))))
  .exhaustive());
const someOf = _curry(2, (f, xs) => someOfFrom(f, xs, 0));


export const mkSt = (start) => ({ tv: new Map([]), rv: new Map([]), next: start });
export const fail = (message) => Err({ message: message });
export const freshVar = (st) => [tVar(st.next), { ...st, next: add(st.next, 1) }];
export const freshRowVar = (st) => [rVar(st.next), { ...st, next: add(st.next, 1) }];
export const resolve = _curry(2, (t, st) => match(t)
  .with({ _tag: "TyVar" }, ({ id }) => match(_Map_get(id, st.tv))
  .with({ _tag: "Some" }, ({ value: next }) => resolve(next, st))
  .with({ _tag: "None" }, () => t)
  .exhaustive())
  .otherwise(() => t));
const resolveRow = _curry(2, (r, st) => match(r)
  .with({ _tag: "RowVar" }, ({ id }) => match(_Map_get(id, st.rv))
  .with({ _tag: "Some" }, ({ value: next }) => resolveRow(next, st))
  .with({ _tag: "None" }, () => r)
  .exhaustive())
  .otherwise(() => r));
export const zonk = _curry(2, (t, st) => match(resolve(t, st))
  .with({ _tag: "TyVar" }, ({ id }) => tVar(id))
  .with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map((a) => zonk(a, st))(args)))
  .with({ _tag: "TyFn" }, ({ from, to }) => tArrow(zonk(from, st), zonk(to, st)))
  .with({ _tag: "TyRecord" }, ({ row }) => tRecord(zonkRow(row, st)))
  .with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value))
  .with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m) => zonk(m, st))(members)))
  .exhaustive());
const zonkRow = _curry(2, (row, st) => match(resolveRow(row, st))
  .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => rExtend(label, zonk(fieldType, st), zonkRow(rest, st)))
  .otherwise((r) => r));
export const occurs = _curry(3, (id, t, st) => match(resolve(t, st))
  .with({ _tag: "TyVar" }, ({ id: rid }) => eq(rid, id))
  .with({ _tag: "TyCon" }, ({ args }) => someOf((a) => occurs(id, a, st), args))
  .with({ _tag: "TyFn" }, ({ from, to }) => or(occurs(id, from, st), occurs(id, to, st)))
  .with({ _tag: "TyRecord" }, ({ row }) => occursRow(id, row, st))
  .with({ _tag: "TySingleton" }, () => false)
  .with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => occurs(id, m, st), members))
  .exhaustive());
const occursRow = _curry(3, (id, row, st) => match(resolveRow(row, st))
  .with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or(occurs(id, fieldType, st), occursRow(id, rest, st)))
  .otherwise(() => false));
export const rowVarOccurs = _curry(3, (id, row, st) => match(resolveRow(row, st))
  .with({ _tag: "RowVar" }, ({ id: rid }) => eq(rid, id))
  .with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or(rowVarOccursInType(id, fieldType, st), rowVarOccurs(id, rest, st)))
  .with({ _tag: "RowEmpty" }, () => false)
  .exhaustive());
const rowVarOccursInType = _curry(3, (id, t, st) => match(resolve(t, st))
  .with({ _tag: "TyVar" }, () => false)
  .with({ _tag: "TyCon" }, ({ args }) => someOf((a) => rowVarOccursInType(id, a, st), args))
  .with({ _tag: "TyFn" }, ({ from, to }) => or(rowVarOccursInType(id, from, st), rowVarOccursInType(id, to, st)))
  .with({ _tag: "TyRecord" }, ({ row }) => rowVarOccurs(id, row, st))
  .with({ _tag: "TySingleton" }, () => false)
  .with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => rowVarOccursInType(id, m, st), members))
  .exhaustive());
const isArrowT = (t) => match(t)
  .with({ _tag: "TyFn" }, () => true)
  .otherwise(() => false);
const isCollection = (name) => or(or(or(eq(name, "Array"), eq(name, "List")), eq(name, "Set")), eq(name, "Map"));
const isTupleT = (t) => match(t)
  .with({ _tag: "TyCon" }, ({ name }) => eq(name, TUPLE))
  .otherwise(() => false);
const tupleParenMsg = _curry(3, (a, b, shown) => (not(eq(isTupleT(a), isTupleT(b))) ? `${shown} — ((a, b)) => takes one tuple; (a, b) => takes two arguments` : shown));
const collectionUnifyMsg = _curry(3, (aname, bname, shown) => (or(or(eq(aname, bname), not(isCollection(aname))), not(isCollection(bname))) ? shown : ((other) => ((hint) => `${shown} — ${hint}`)((eq(other, "List") ? "unqualified map/filter/length expect Array; use List.map" : (eq(other, "Set") ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*" : (eq(other, "Map") ? "unqualified map/filter/length expect Array; use Map.*" : `${aname} and ${bname} are distinct collections`)))))((eq(aname, "Array") ? bname : (eq(bname, "Array") ? aname : "")))));
const unifyMismatch = _curry(2, (ra, rb) => (not(eq(isArrowT(ra), isArrowT(rb))) ? (([fn, val]) => fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)} — a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`)))((isArrowT(ra) ? [ra, rb] : [rb, ra])) : fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`))));
const unifyArgs = _curry(4, (as_, bs, i, st) => match(_Array_get(i, as_))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: a }) => match(_Array_get(i, bs))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: b }) => _Result_flatMap((s1) => unifyArgs(as_, bs, add(i, 1), s1))(unify(a, b, st)))
  .exhaustive())
  .exhaustive());
const isPrimT = _curry(2, (t, name) => match(t)
  .with({ _tag: "TyCon" }, ({ name: n, args }) => and(eq(n, name), eq(length(args), 0)))
  .otherwise(() => false));
const isLitOnlyUnion = (members) => match(members)
  .with((_v) => _v.length === 0, () => true)
  .with((_v) => _v.length >= 1 && _v[0]._tag === "TySingleton", ([, ...rest]) => isLitOnlyUnion(rest))
  .otherwise(() => false);
const widenLitBindingsFrom = _curry(3, (ids, lit, st) => match(ids)
  .with((_v) => _v.length === 0, () => st)
  .with((_v) => _v.length >= 1, ([id, ...rest]) => match(_Map_get(id, st.tv))
  .with({ _tag: "Some" }, ({ value: t }) => match(resolve(t, st))
  .with({ _tag: "TySingleton" }, ({ base, value }) => match(lit)
  .with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => (and(eq(base, lbase), eq(value, lvalue)) ? widenLitBindingsFrom(rest, lit, { ...st, tv: _Map_set(id, tPrim(base), st.tv) }) : widenLitBindingsFrom(rest, lit, st)))
  .otherwise(() => widenLitBindingsFrom(rest, lit, st)))
  .otherwise(() => widenLitBindingsFrom(rest, lit, st)))
  .with({ _tag: "None" }, () => widenLitBindingsFrom(rest, lit, st))
  .exhaustive())
  .exhaustive());
const widenLitBindings = _curry(2, (lit, st) => widenLitBindingsFrom(_Map_keys(st.tv), lit, st));
const litInUnionFrom = _curry(4, (lit, members, i, st) => match(_Array_get(i, members))
  .with({ _tag: "None" }, () => fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`))
  .with({ _tag: "Some" }, ({ value: m }) => match(m)
  .with({ _tag: "TySingleton" }, ({ base, value }) => match(lit)
  .with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => (and(eq(base, lbase), eq(value, lvalue)) ? Ok(st) : litInUnionFrom(lit, members, add(i, 1), st)))
  .otherwise(() => litInUnionFrom(lit, members, add(i, 1), st)))
  .otherwise(() => match(unify(lit, m, st))
  .with({ _tag: "Ok" }, ({ value: st1 }) => Ok(st1))
  .with({ _tag: "Err" }, () => litInUnionFrom(lit, members, add(i, 1), st))
  .exhaustive()))
  .exhaustive());
const unifyMemberAgainstUnionFrom = _curry(4, (member, members, i, st) => match(member)
  .with({ _tag: "TySingleton" }, () => litInUnionFrom(member, members, 0, st))
  .otherwise(() => unifyConcreteAgainstUnionFrom(member, members, i, st)));
const unifyConcreteAgainstUnionFrom = _curry(4, (member, members, i, st) => match(_Array_get(i, members))
  .with({ _tag: "None" }, () => fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`))
  .with({ _tag: "Some" }, ({ value: m }) => match(unify(member, m, st))
  .with({ _tag: "Ok" }, ({ value: st1 }) => Ok(st1))
  .with({ _tag: "Err" }, () => unifyConcreteAgainstUnionFrom(member, members, add(i, 1), st))
  .exhaustive())
  .exhaustive());
const unifyUnionMembersFrom = _curry(4, (members, u, i, st) => match(_Array_get(i, members))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: m }) => match(u)
  .with({ _tag: "TyOneOf" }, ({ members: ums }) => _Result_flatMap((s1) => unifyUnionMembersFrom(members, u, add(i, 1), s1))(unifyMemberAgainstUnionFrom(m, ums, 0, st)))
  .otherwise(() => Ok(st)))
  .exhaustive());
const unifyLitUnion = _curry(3, (a, b, st) => match(a)
  .with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match(b)
  .with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => (and(eq(abase, bbase), eq(aval, bval)) ? Ok(st) : (eq(abase, bbase) ? Ok(widenLitBindings(b, widenLitBindings(a, st))) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))))
  .with({ _tag: "TyOneOf" }, ({ members }) => litInUnionFrom(a, members, 0, st))
  .otherwise(() => (isPrimT(b, abase) ? Ok(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))))
  .with({ _tag: "TyOneOf" }, ({ members: amembers }) => match(b)
  .with({ _tag: "TySingleton" }, () => litInUnionFrom(b, amembers, 0, st))
  .with({ _tag: "TyOneOf" }, ({ members: bmembers }) => _Result_flatMap((s1) => unifyUnionMembersFrom(bmembers, a, 0, s1))(unifyUnionMembersFrom(amembers, b, 0, st)))
  .otherwise(() => (isLitOnlyUnion(amembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(b, amembers, 0, st))))
  .otherwise(() => match(b)
  .with({ _tag: "TySingleton" }, ({ base: bbase }) => (isPrimT(a, bbase) ? Ok(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`)))
  .with({ _tag: "TyOneOf" }, ({ members: bmembers }) => (isLitOnlyUnion(bmembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(a, bmembers, 0, st)))
  .otherwise(() => fail(`cannot unify ${showType(a)} with ${showType(b)}`))));
export const unify = _curry(3, (a, b, st) => { const ra = resolve(a, st); const rb = resolve(b, st); return match(ra)
  .with({ _tag: "TyVar" }, ({ id: aid }) => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => (eq(aid, bid) ? Ok(st) : bindVar(aid, rb, st)))
  .otherwise(() => bindVar(aid, rb, st)))
  .with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
  .with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => (and(eq(aname, bname), eq(length(aargs), length(bargs))) ? unifyArgs(aargs, bargs, 0, st) : fail(tupleParenMsg(ra, rb, collectionUnifyMsg(aname, bname, `cannot unify ${showType(ra)} with ${showType(rb)}`)))))
  .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
  .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
  .otherwise(() => unifyMismatch(ra, rb)))
  .with({ _tag: "TyFn" }, ({ from: afrom, to: ato }) => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
  .with({ _tag: "TyFn" }, ({ from: bfrom, to: bto }) => _Result_flatMap((s1) => unify(ato, bto, s1))(unify(afrom, bfrom, st)))
  .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
  .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
  .otherwise(() => unifyMismatch(ra, rb)))
  .with({ _tag: "TyRecord" }, ({ row: arow }) => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
  .with({ _tag: "TyRecord" }, ({ row: brow }) => unifyRows(arow, brow, st))
  .with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st))
  .with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st))
  .otherwise(() => unifyMismatch(ra, rb)))
  .with({ _tag: "TySingleton" }, () => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
  .otherwise(() => unifyLitUnion(ra, rb, st)))
  .with({ _tag: "TyOneOf" }, () => match(rb)
  .with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st))
  .otherwise(() => unifyLitUnion(ra, rb, st)))
  .exhaustive(); });
const bindVar = _curry(3, (id, t, st) => (occurs(id, t, st) ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk(t, st))}`) : Ok({ ...st, tv: _Map_set(id, t, st.tv) })));
const rewriteRow = _curry(3, (row, label, st) => match(resolveRow(row, st))
  .with({ _tag: "RowEmpty" }, () => fail(`record missing field '${label}'`))
  .with({ _tag: "RowExtend" }, ({ label: rlabel, fieldType: rtype, rest: rrest }) => (eq(rlabel, label) ? Ok([rtype, rrest, st]) : _Result_map(([subType, subRest, subSt]) => [subType, rExtend(rlabel, rtype, subRest), subSt])(rewriteRow(rrest, label, st))))
  .with({ _tag: "RowVar" }, ({ id: rid }) => (([freshT, st1]) => (([freshTail, st2]) => Ok([freshT, freshTail, { ...st2, rv: _Map_set(rid, rExtend(label, freshT, freshTail), st2.rv) }]))(freshRowVar(st1)))(freshVar(st)))
  .exhaustive());
export const unifyRows = _curry(3, (r1, r2, st) => { const a = resolveRow(r1, st); const b = resolveRow(r2, st); return match(a)
  .with({ _tag: "RowEmpty" }, () => match(b)
  .with({ _tag: "RowEmpty" }, () => Ok(st))
  .with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st))
  .with({ _tag: "RowExtend" }, ({ label }) => fail(`record missing field '${label}'`))
  .exhaustive())
  .with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, b, st))
  .with({ _tag: "RowExtend" }, ({ label: alabel, fieldType: atype, rest: arest }) => match(b)
  .with({ _tag: "RowEmpty" }, () => fail(`record has extra field '${alabel}'`))
  .with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st))
  .with({ _tag: "RowExtend" }, () => _Result_flatMap(([btype, brest, s1]) => _Result_flatMap((s2) => unifyRows(arest, brest, s2))(unify(atype, btype, s1)))(rewriteRow(b, alabel, st)))
  .exhaustive())
  .exhaustive(); });
const bindRowVar = _curry(3, (id, row, st) => match(resolveRow(row, st))
  .with((_v) => _v._tag === "RowVar" && (({ id: rid }) => eq(rid, id))(_v), ({ id: rid }) => Ok(st))
  .otherwise((r) => (rowVarOccurs(id, r, st) ? fail("infinite record type") : Ok({ tv: st.tv, rv: _Map_set(id, r, st.rv), next: st.next }))));
