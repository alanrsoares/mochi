/** Runtime adapter: bun:test behind ReScript-shaped `assertEq` / `ok` / `throws`. */

import { describe, expect, test } from "bun:test";

export { describe, test };
export const testSkip = test.skip;
export const testOnly = test.only;

/** Expected first, actual last — `got |> assertEq(want)`. */
export const assertEq = <A>(expected: A, actual: A): void => {
  expect(actual).toEqual(expected);
};

export const ok = (actual: boolean): void => {
  expect(actual).toBe(true);
};

export const throws = (fn: () => unknown): void => {
  expect(fn).toThrow();
};
