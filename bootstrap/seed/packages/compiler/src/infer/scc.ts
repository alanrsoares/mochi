export type TSt = {
  index: Map<number, number>;
  low: Map<number, number>;
  onStack: Set<number>;
  stack: number[];
  counter: number;
  sccs: number[][];
};

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_drop,
  _Array_get,
  _Array_take,
  _Map_getOr,
  _Map_has,
  _Map_set,
  _Option_match,
  _Set_add,
  _Set_diff,
  _Set_fromArray,
  _Set_has,
  _curry,
  _done,
  _recur,
  add,
  eq,
  length,
  min,
} from "@mochi/compiler/runtime";

const hasIndex: <A, B, C>(v: A, st: { index: Map<A, B> } & C) => boolean = _curry(
  2,
  <A, B, C>(v: A, st: { index: Map<A, B> } & C) => _Map_has(v, st.index),
);
const indexOfV: <A, B>(v: A, st: { index: Map<A, number> } & B) => number = _curry(
  2,
  <A, B>(v: A, st: { index: Map<A, number> } & B) => _Map_getOr(-1, v, st.index),
);
const lowOfV: <A, B>(v: A, st: { low: Map<A, number> } & B) => number = _curry(
  2,
  <A, B>(v: A, st: { low: Map<A, number> } & B) => _Map_getOr(-1, v, st.low),
);
const neighborsOf: <A>(v: number, adj: A[][]) => A[] = _curry(2, <A>(v: number, adj: A[][]) =>
  _Option_match(
    _Array_get(v, adj),
    () => [] as A[],
    (ws) => ws,
  ),
);
const indexOfFrom: <A>(v: A, xs: A[], i: number) => number = _curry(
  3,
  <A>(v: A, xs: A[], i: number) => {
    let j: number = i;
    while (true) {
      {
        const $loopMatch = _Array_get(j, xs);
        if ($loopMatch._tag === "None") {
          return -1;
        }
        if ($loopMatch._tag === "Some") {
          const { value: x } = $loopMatch;
          if (eq(x, v)) {
            return j;
          } else {
            j = j + 1;
            continue;
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const visitNeighbors: _Curry<[v: number, ws: number[], adj: number[][], st: TSt], TSt> = _curry(
  4,
  (v: number, ws: number[], adj: number[][], st: TSt) => {
    let remaining: number[] = ws;
    let current: TSt = st;
    while (true) {
      const _step = ((_v) =>
        _v.length === 0
          ? _done(current)
          : _v.length >= 1
            ? (([w, ...rest]) =>
                hasIndex(w, current)
                  ? _Set_has(w, current.onStack)
                    ? _recur(rest, {
                        ...current,
                        low: _Map_set(
                          v,
                          min(lowOfV(v, current), indexOfV(w, current)),
                          current.low,
                        ),
                      })
                    : _recur(rest, current)
                  : ((next: TSt) =>
                      _recur(rest, {
                        ...next,
                        low: _Map_set(v, min(lowOfV(v, next), lowOfV(w, next)), next.low),
                      }))(connect(w, adj, current)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(remaining);
      if (_step._tag === "recur") {
        [remaining, current] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
const connect: _Curry<[v: number, adj: number[][], st: TSt], TSt> = _curry(
  3,
  (v: number, adj: number[][], st: TSt) => {
    const st1: TSt = {
      ...st,
      index: _Map_set(v, st.counter, st.index),
      low: _Map_set(v, st.counter, st.low),
      onStack: _Set_add(v, st.onStack),
      stack: _Array_append(v, st.stack),
      counter: st.counter + 1,
    };
    const st2: TSt = visitNeighbors(v, neighborsOf(v, adj), adj, st1);
    return eq(lowOfV(v, st2), indexOfV(v, st2))
      ? ((start: number) =>
          ((comp: number[]) => ({
            ...st2,
            onStack: _Set_diff(st2.onStack, _Set_fromArray(comp)),
            stack: _Array_take(start, st2.stack),
            sccs: _Array_append(comp, st2.sccs),
          }))(_Array_drop(start, st2.stack)))(indexOfFrom(v, st2.stack, 0))
      : st2;
  },
);
const connectAllFrom: _Curry<[i: number, n: number, adj: number[][], st: TSt], TSt> = _curry(
  4,
  (i: number, n: number, adj: number[][], st: TSt) => {
    let j: number = i;
    let current: TSt = st;
    while (true) {
      if (j >= n) {
        return current;
      } else {
        {
          const $recur0: number = j + 1;
          const $recur1: TSt = hasIndex(j, current) ? current : connect(j, adj, current);
          j = $recur0;
          current = $recur1;
          continue;
        }
      }
    }
  },
);
export const stronglyConnected: (adj: number[][]) => number[][] = (adj: number[][]) => {
  const n: number = length(adj);
  const initSt: TSt = {
    index: new Map([]),
    low: new Map([]),
    onStack: _Set_fromArray([]),
    stack: [],
    counter: 0,
    sccs: [],
  };
  return connectAllFrom(0, n, adj, initSt).sccs;
};
