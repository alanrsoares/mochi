const _curry = (n, f) => {
  const apply = (a) => {
    switch (a.length) {
      case 2:
        return f(a[0], a[1]);
      case 3:
        return f(a[0], a[1], a[2]);
      case 4:
        return f(a[0], a[1], a[2], a[3]);
      case 5:
        return f(a[0], a[1], a[2], a[3], a[4]);
      case 6:
        return f(a[0], a[1], a[2], a[3], a[4], a[5]);
      default:
        return f(...a);
    }
  };
  function c(...a) {
    if (a.length === n)
      return apply(a);
    if (a.length < n)
      return (...b) => c(...a, ...b);
    return a.slice(n).reduce((g, x) => g(x), apply(a.slice(0, n)));
  }
  if (n === 2)
    return (...a) => {
      if (a.length === 2)
        return f(a[0], a[1]);
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return (...b) => b.length === 1 ? f(x, b[0]) : c(x, ...b);
    };
  if (n === 3)
    return (...a) => {
      if (a.length === 3)
        return f(a[0], a[1], a[2]);
      if (a.length === 2) {
        const [x, y] = a;
        return (...b) => b.length === 1 ? f(x, y, b[0]) : c(x, y, ...b);
      }
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return _curry(2, (y, z) => f(x, y, z));
    };
  return c;
};
const add = _curry(2, (a, b) => a + b);
const mul = _curry(2, (a, b) => a * b);
const gt = _curry(2, (a, b) => a > b);

import { defineContainer } from "@re-reduced/preact";
export { defineContainer };
import { useContainer } from "@re-reduced/preact";
export { useContainer };
import { useSelect as $useSelect } from "@re-reduced/preact";
const useSelect = _curry(2, $useSelect);
export { useSelect };
import { useWatch as $useWatch } from "@re-reduced/preact";
const useWatch = _curry(3, $useWatch);
export { useWatch };
import { Intent } from "./runtime";
export { Intent };
import { fetchScore } from "./host";
export { fetchScore };
export const game = defineContainer("game", { state: { count: 0, name: "" }, actions: (on) => ({ bump: on((s) => ({ count: add(s.count, 1) })), setName: on(_curry(2, (s, n) => ({ name: n }))) }), derive: (s) => ({ doubled: () => mul(s.count.value, 2) }), effects: (fx) => [fx.onAction("setName", _curry(2, (n, ctx) => [Intent.storageSet("name", n)])), fx.onChange((s) => s.count.value, _curry(3, (value, prev, ctx) => [])), fx.onEnter((s) => gt(s.count.value, 9), (ctx) => [Intent.timeout(10, () => undefined)])] });
export const doubled = () => { const store = useContainer(game); return useSelect(store, _curry(2, (s, d) => d.doubled.value)); };
export const count = () => { const store = useContainer(game); return useSelect(store, (s) => s.count.value); };
export const watched = () => { const store = useContainer(game); return useWatch(store, (s) => s.count.value, (n) => add(n, 1)); };
export const rename = () => { const store = useContainer(game); return store.actions.setName("ada"); };
export const score = Intent.query({ key: ["score"], task: fetchScore("ada"), onOk: (n) => add(n, 1), onErr: (e) => e });
