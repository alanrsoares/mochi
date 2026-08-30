export type TSt = {
  index: Map<number, number>;
  low: Map<number, number>;
  onStack: Set<number>;
  stack: number[];
  counter: number;
  sccs: number[][];
};

import type { _Curry } from "@mochi/compiler/runtime";

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
  _Set_add,
  _Set_diff,
  _Set_fromArray,
  _Set_has,
  _curry,
  _done,
  _recur,
  add,
  eq,
  gte,
  length,
  min,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

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
  match(_Array_get(v, adj))
    .with({ _tag: "Some" }, ({ value: ws }) => ws)
    .with({ _tag: "None" }, () => [] as A[])
    .exhaustive(),
);
const indexOfFrom: <A>(v: A, xs: A[], i: number) => number = _curry(
  3,
  <A>(v: A, xs: A[], i: number) => {
    let j: number = i;
    while (true) {
      const _step = match(_Array_get(j, xs))
        .with({ _tag: "None" }, () => _done(-1))
        .with({ _tag: "Some" }, ({ value: x }) => (eq(x, v) ? _done(j) : _recur(add(j, 1))))
        .exhaustive();
      if (_step._tag === "recur") {
        j = _step.args[0];
        continue;
      }
      return _step.value;
    }
  },
);
const visitNeighbors: _Curry<[v: number, ws: number[], adj: number[][], st: TSt], TSt> = _curry(
  4,
  (v: number, ws: number[], adj: number[][], st: TSt) => {
    let remaining: number[] = ws;
    let current: TSt = st;
    while (true) {
      const _step = match(remaining)
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 0;
          },
          () => _done(current),
        )
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length >= 1;
          },
          ([w, ...rest]) =>
            hasIndex(w, current)
              ? _Set_has(w, current.onStack)
                ? _recur(rest, {
                    ...current,
                    low: _Map_set(v, min(lowOfV(v, current), indexOfV(w, current)), current.low),
                  })
                : _recur(rest, current)
              : ((next: TSt) =>
                  _recur(rest, {
                    ...next,
                    low: _Map_set(v, min(lowOfV(v, next), lowOfV(w, next)), next.low),
                  }))(connect(w, adj, current)),
        )
        .otherwise(() => {
          throw new Error("non-exhaustive match");
        });
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
      counter: add(st.counter, 1),
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
      if (gte(j, n)) {
        return current;
      } else {
        [j, current] = [add(j, 1), hasIndex(j, current) ? current : connect(j, adj, current)];
        continue;
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
