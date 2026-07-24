// Host runtime for the mochi modules example — the JS primitives the `.mochi`
// modules bind via `extern`. Multi-arg exports are FLAT `(a, b) => …`; mochi
// wraps them in `_curry` so both `f(a, b)` and `f(a)(b)` work. `pi` is a plain
// value binding.
export const add = (a, b) => a + b;
export const mul = (a, b) => a * b;
export const sqrt = (x) => Math.sqrt(x);
export const pi = Math.PI;
export const log = (label, x) => {
  console.log(label, x);
  return x;
};
