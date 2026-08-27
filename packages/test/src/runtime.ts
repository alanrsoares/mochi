/** Runtime adapter: bun:test + fast-check behind ReScript-shaped bindings. */

import { describe, expect, test } from "bun:test";
import fc from "fast-check";

export { describe, test };
export const testSkip = test.skip;
/**
 * bun <1.4 throws if `test.only` is *read* when `CI=true`. Bind on call so
 * importing the runtime does not throw even if someone is still on 1.3.
 */
export const testOnly = (name: string, fn: () => void | Promise<void>): void => {
  test.only(name, fn);
};

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

type BunTimeout = { readonly timeout: number };

const bunTimeout = (timeout: number): BunTimeout => ({ timeout });

const registerTest = (
  name: string,
  fn: () => void | Promise<void>,
  timeout: number | undefined,
): void => {
  if (timeout === undefined) {
    test(name, fn);
    return;
  }
  test(name, fn, bunTimeout(timeout));
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
const eachOrFail = <A>(
  title: string,
  rows: readonly A[],
  kind: string,
  timeout: number | undefined,
  register: (name: string, row: A) => void,
): void => {
  if (rows.length === 0) {
    registerTest(
      `${title} (empty table)`,
      () => {
        throw new Error(`${kind}: no rows`);
      },
      timeout,
    );
    return;
  }
  rows.forEach((row, index) => {
    register(`${title} ${labelOf(row, index)}`, row);
  });
};

export const testEach = <A>(title: string, rows: readonly A[], fn: (row: A) => void): void => {
  eachOrFail(title, rows, "testEach", undefined, (name, row) => {
    registerTest(name, () => fn(row), undefined);
  });
};

export const testTimeout = (timeout: number, title: string, fn: () => void): void => {
  registerTest(title, fn, timeout);
};

export const testEachTimeout = <A>(
  timeout: number,
  title: string,
  rows: readonly A[],
  fn: (row: A) => void,
): void => {
  eachOrFail(title, rows, "testEach", timeout, (name, row) => {
    registerTest(name, () => fn(row), timeout);
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
  runCheck(title, arb, fn, undefined);
};

export const checkTimeout = <A>(
  timeout: number,
  title: string,
  arb: fc.Arbitrary<A>,
  fn: (value: A) => void,
): void => {
  runCheck(title, arb, fn, timeout);
};

const runCheck = <A>(
  title: string,
  arb: fc.Arbitrary<A>,
  fn: (value: A) => void,
  timeout: number | undefined,
): void => {
  registerTest(
    title,
    () => {
      fc.assert(fc.property(arb, (value) => fn(value)));
    },
    timeout,
  );
};

type TaskThunk<A, E> = () => Promise<Ok<A> | Err<E>>;

const throwIfErr = <A, E>(settled: Ok<A> | Err<E>): void => {
  if (settled._tag !== "Err") return;
  const { error } = settled;
  throw error instanceof Error ? error : new Error(String(error));
};

const runTask = async <E>(task: TaskThunk<void, E>): Promise<void> => {
  throwIfErr(await task());
};

/**
 * Kick-off a `Task () e`. bun waits on the Promise; `Err` fails the test.
 * Do not `ignore(Task.run(t))` in a sync `test` — the runner would not wait.
 */
export const testTask = <E>(title: string, task: TaskThunk<void, E>): void => {
  registerTest(title, () => runTask(task), undefined);
};

export const testTaskTimeout = <E>(
  timeout: number,
  title: string,
  task: TaskThunk<void, E>,
): void => {
  registerTest(title, () => runTask(task), timeout);
};

export const testTaskSkip = <E>(title: string, task: TaskThunk<void, E>): void => {
  test.skip(title, () => runTask(task));
};

export const testTaskOnly = <E>(title: string, task: TaskThunk<void, E>): void => {
  test.only(title, () => runTask(task));
};

export const testEachTask = <A, E>(
  title: string,
  rows: readonly A[],
  fn: (row: A) => TaskThunk<void, E>,
): void => {
  eachTask(title, rows, fn, undefined);
};

export const testEachTaskTimeout = <A, E>(
  timeout: number,
  title: string,
  rows: readonly A[],
  fn: (row: A) => TaskThunk<void, E>,
): void => {
  eachTask(title, rows, fn, timeout);
};

const eachTask = <A, E>(
  title: string,
  rows: readonly A[],
  fn: (row: A) => TaskThunk<void, E>,
  timeout: number | undefined,
): void => {
  eachOrFail(title, rows, "testEachTask", timeout, (name, row) => {
    registerTest(name, () => runTask(fn(row)), timeout);
  });
};

export const checkTask = <A, E>(
  title: string,
  arb: fc.Arbitrary<A>,
  fn: (value: A) => TaskThunk<void, E>,
): void => {
  runCheckTask(title, arb, fn, undefined);
};

export const checkTaskTimeout = <A, E>(
  timeout: number,
  title: string,
  arb: fc.Arbitrary<A>,
  fn: (value: A) => TaskThunk<void, E>,
): void => {
  runCheckTask(title, arb, fn, timeout);
};

const runCheckTask = <A, E>(
  title: string,
  arb: fc.Arbitrary<A>,
  fn: (value: A) => TaskThunk<void, E>,
  timeout: number | undefined,
): void => {
  registerTest(
    title,
    () => fc.assert(fc.asyncProperty(arb, (value) => runTask(fn(value)))),
    timeout,
  );
};
