/** Runtime adapter: bun:test + fast-check behind ReScript-shaped bindings. */

import { describe, expect, test } from "bun:test";
import fc from "fast-check";

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

const labelOf = (row: unknown, index: number): string => {
  if (typeof row === "object" && row !== null && "label" in row) {
    const label = Reflect.get(row, "label");
    if (typeof label === "string") return label;
  }
  try {
    const json = JSON.stringify(row);
    return json ?? `[${index}]`;
  } catch {
    return `[${index}]`;
  }
};

/**
 * One bun:test per row. Passes the row as a single argument — do not use
 * `test.each`, which spreads array rows, and Mochi tuples are JS arrays.
 */
export const testEach = <A>(title: string, rows: readonly A[], fn: (row: A) => void): void => {
  if (rows.length === 0) {
    test(`${title} (empty table)`, () => {
      throw new Error("testEach: no rows");
    });
    return;
  }
  rows.forEach((row, index) => {
    test(`${title} ${labelOf(row, index)}`, () => fn(row));
  });
};

export const int = fc.integer();
export const nat = fc.nat();
export const float = fc.float();
export const bool = fc.boolean();
export const text = fc.string();

export const constant = <A>(value: A): fc.Arbitrary<A> => fc.constant(value);

export const array = <A>(arb: fc.Arbitrary<A>): fc.Arbitrary<A[]> => fc.array(arb);

export const oneof = <A>(arbs: readonly fc.Arbitrary<A>[]): fc.Arbitrary<A> => {
  const head = arbs[0];
  if (head === undefined) throw new Error("oneof needs at least one arbitrary");
  return fc.oneof(head, ...arbs.slice(1));
};

export const pair = <A, B>(left: fc.Arbitrary<A>, right: fc.Arbitrary<B>): fc.Arbitrary<[A, B]> =>
  fc.tuple(left, right);

export const triple = <A, B, C>(
  a: fc.Arbitrary<A>,
  b: fc.Arbitrary<B>,
  c: fc.Arbitrary<C>,
): fc.Arbitrary<[A, B, C]> => fc.tuple(a, b, c);

export const mapArb = <A, B>(f: (value: A) => B, arb: fc.Arbitrary<A>): fc.Arbitrary<B> =>
  arb.map(f);

export const filterArb = <A>(pred: (value: A) => boolean, arb: fc.Arbitrary<A>): fc.Arbitrary<A> =>
  arb.filter(pred);

type None = { readonly _tag: "None" };
type Some<A> = { readonly _tag: "Some"; readonly value: A };
type Ok<A> = { readonly _tag: "Ok"; readonly value: A };
type Err<E> = { readonly _tag: "Err"; readonly error: E };

export const option = <A>(arb: fc.Arbitrary<A>): fc.Arbitrary<Some<A> | None> =>
  fc.option(arb).map((value) => (value === null ? { _tag: "None" } : { _tag: "Some", value }));

export const result = <A, E>(
  okArb: fc.Arbitrary<A>,
  errArb: fc.Arbitrary<E>,
): fc.Arbitrary<Ok<A> | Err<E>> =>
  fc.oneof(
    okArb.map((value) => ({ _tag: "Ok" as const, value })),
    errArb.map((error) => ({ _tag: "Err" as const, error })),
  );

export const check = <A>(title: string, arb: fc.Arbitrary<A>, fn: (value: A) => void): void => {
  test(title, () => {
    fc.assert(fc.property(arb, (value) => fn(value)));
  });
};
