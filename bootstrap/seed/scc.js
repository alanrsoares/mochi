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
const gte = _curry(2, (a, b) => a >= b);
const min = _curry(2, (a, b) => Math.min(a, b));
const length = (xs) => xs.length;
const _Set_has = _curry(2, (x, s) => s.has(x));
const _Set_add = _curry(2, (x, s) => new Set(s).add(x));
const _Set_fromArray = (xs) => new Set(xs);
const _Set_diff = _curry(2, (a, b) => new Set([...a].filter((x) => !b.has(x))));
const _Map_has = _curry(2, (k, m) => m.has(k));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_take = _curry(2, (n, xs) => xs.slice(0, n));
const _Array_drop = _curry(2, (n, xs) => xs.slice(n));


const hasIndex = _curry(2, (v, st) => _Map_has(v, st.index));
const indexOfV = _curry(2, (v, st) => _Map_getOr(-1, v, st.index));
const lowOfV = _curry(2, (v, st) => _Map_getOr(-1, v, st.low));
const neighborsOf = _curry(2, (v, adj) => match(_Array_get(v, adj))
  .with({ _tag: "Some" }, ({ value: ws }) => ws)
  .with({ _tag: "None" }, () => [])
  .exhaustive());
const indexOfFrom = _curry(3, (v, xs, i) => { let j = i; while (true) { const _step = match(_Array_get(j, xs))
  .with({ _tag: "None" }, () => _done(-1))
  .with({ _tag: "Some" }, ({ value: x }) => (eq(x, v) ? _done(j) : _recur(add(j, 1))))
  .exhaustive(); if (_step._tag === "recur") { j = _step.args[0]; continue; } return _step.value; } });
const visitNeighbors = _curry(4, (v, ws, adj, st) => { let remaining = ws; let current = st; while (true) { const _step = match(remaining)
  .with((_v) => _v.length === 0, () => _done(current))
  .with((_v) => _v.length >= 1, ([w, ...rest]) => (hasIndex(w, current) ? (_Set_has(w, current.onStack) ? _recur(rest, { ...current, low: _Map_set(v, min(lowOfV(v, current), indexOfV(w, current)), current.low) }) : _recur(rest, current)) : ((next) => _recur(rest, { ...next, low: _Map_set(v, min(lowOfV(v, next), lowOfV(w, next)), next.low) }))(connect(w, adj, current))))
  .exhaustive(); if (_step._tag === "recur") { [remaining, current] = _step.args; continue; } return _step.value; } });
const connect = _curry(3, (v, adj, st) => { const st1 = { ...st, index: _Map_set(v, st.counter, st.index), low: _Map_set(v, st.counter, st.low), onStack: _Set_add(v, st.onStack), stack: _Array_append(v, st.stack), counter: add(st.counter, 1) }; const st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1); return (eq(lowOfV(v, st2), indexOfV(v, st2)) ? ((start) => ((comp) => ({ ...st2, onStack: _Set_diff(st2.onStack, _Set_fromArray(comp)), stack: _Array_take(start, st2.stack), sccs: _Array_append(comp, st2.sccs) }))(_Array_drop(start, st2.stack)))(indexOfFrom(v, st2.stack, 0)) : st2); });
const connectAllFrom = _curry(4, (i, n, adj, st) => { let j = i; let current = st; while (true) { if (gte(j, n)) { return current; } else { [j, current] = [add(j, 1), (hasIndex(j, current) ? current : connect(j, adj, current))]; continue; } } });
export const stronglyConnected = (adj) => { const n = length(adj); const initSt = { index: new Map([]), low: new Map([]), onStack: _Set_fromArray([]), stack: [], counter: 0, sccs: [] }; return connectAllFrom(0, n, adj, initSt).sccs; };
