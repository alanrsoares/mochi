// The async runtime, hand-written host JS. A Task is a LAZY async computation:
// `() => Promise<a>`. Building one runs no effect; `run` is what starts it —
// so a Task is a referentially-transparent value, unlike a bare Promise.
//
// Most combinators are nested-curried (`f => t => …`) so they compose with
// mochi's `|>`, which lowers `t |> f(x)` to `f(x)(t)`. `delay` is `_curry`-
// shaped so both `delay(ms, x)` (multi-arg emit) and `andThen(delay(ms))`
// (partial) work.
const curry2 = (f) =>
  function c(...a) {
    if (a.length < 2) return (...b) => c(...a, ...b);
    return f(a[0], a[1]);
  };

export const of = (x) => () => Promise.resolve(x);
export const mapT = (f) => (t) => () => t().then(f);
export const andThen = (f) => (t) => () => t().then((x) => f(x)());
export const delay = curry2(
  (ms, x) => () => new Promise((res) => setTimeout(() => res(x), ms)),
);
export const run = (t) => t(); // kick it off — hands the Promise to the JS host
