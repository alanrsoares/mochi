// The async runtime, hand-written host JS. A Task is a LAZY async computation:
// `() => Promise<a>`. Building one runs no effect; `run` is what starts it —
// so a Task is a referentially-transparent value, unlike a bare Promise.
//
// Every combinator is CURRIED (`f => t => …`) so it composes with alang's `|>`,
// which lowers `t |> f(x)` to `f(x)(t)`.
export const of = (x) => () => Promise.resolve(x);
export const mapT = (f) => (t) => () => t().then(f);
export const andThen = (f) => (t) => () => t().then((x) => f(x)());
export const delay = (ms) => (x) => () => new Promise((res) => setTimeout(() => res(x), ms));
export const run = (t) => t(); // kick it off — hands the Promise to the JS host
export const add = (a) => (b) => a + b;
