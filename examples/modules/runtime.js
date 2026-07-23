// Host runtime for the mochi modules example — the JS primitives the `.al`
// modules bind via `extern`. Functions are uncurried (mochi lowers multi-arg
// calls to uncurried JS calls); `pi` is a plain value binding.
export const add = (a, b) => a + b;
export const mul = (a, b) => a * b;
export const sqrt = (x) => Math.sqrt(x);
export const pi = Math.PI;
export const log = (label, x) => {
  console.log(label, x);
  return x;
};
