// Tarjan's strongly-connected components — the dependency-grouping step of
// let-generalization (infer.ts) and a pure graph algorithm with no compiler
// dependencies, which is why it lives alone.

// Returns strongly-connected components (mutually recursive groups) in
// DEPENDENCY-FIRST order — exactly the order to generalize them, since a
// group's dependencies are already generalized by the time it's inferred.
// Tarjan naturally emits SCCs in reverse-topological order, which is that order.
export const stronglyConnected = (adj: number[][]): number[][] => {
  const n = adj.length;
  const index = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(0);
  const onStack = new Array<boolean>(n).fill(false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  let counter = 0;

  const connect = (v: number): void => {
    index[v] = counter;
    low[v] = counter;
    counter++;
    stack.push(v);
    onStack[v] = true;
    for (const w of adj[v]!) {
      if (index[w] === -1) {
        connect(w);
        low[v] = Math.min(low[v]!, low[w]!);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v]!, index[w]!);
      }
    }
    if (low[v] === index[v]) {
      // v roots an SCC: the stack suffix from v to the top is exactly that
      // component. Slice it off and truncate the stack (no in-place `.pop()`).
      const start = stack.indexOf(v);
      const comp = stack.slice(start);
      for (const w of comp) onStack[w] = false;
      stack.length = start;
      sccs.push(comp);
    }
  };

  for (let i = 0; i < n; i++) if (index[i] === -1) connect(i);
  return sccs;
};
