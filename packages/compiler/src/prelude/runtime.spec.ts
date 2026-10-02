// The generated typed runtime (src/runtime.ts, ADR 0026) must not just
// type-check — its bodies must behave identically to the JS backend's inlined
// preamble, since both are meant to be the same prelude. Spot-check the shapes
// that matter: currying, structural eq, collection ops, Option ctors.
import { expect, test } from "bun:test";
import { _Array_dedupeBy, _curry, add, eq, map, None, Some } from "@mochi/compiler/runtime";
import fc from "fast-check";

test("_curry supports grouped and one-at-a-time application", () => {
  expect(add(2, 3)).toBe(5);
  // Curried application works at runtime (via _curry); the static type is flat.
  const add2 = (add as unknown as (a: number) => (b: number) => number)(2);
  expect(add2(3)).toBe(5);
  expect(_curry(2, (a: number, b: number) => a + b)(4)(5)).toBe(9);
});

test("eq is structural", () => {
  expect(eq([1, 2], [1, 2])).toBe(true);
  expect(eq({ a: 1 }, { a: 2 })).toBe(false);
});

test("record equality requires matching own enumerable keys", () => {
  const same = (left: Record<string, unknown>, right: Record<string, unknown>): boolean =>
    eq(left, right);
  expect(same({ a: undefined }, { b: undefined })).toBe(false);
  expect(same({ a: undefined }, {})).toBe(false);
  expect(same({ a: undefined }, { a: undefined })).toBe(true);
  const inherited = Object.assign(Object.create({ a: 1 }), { b: 2 });
  expect(same({ a: 1 }, inherited)).toBe(false);
  expect(same(inherited, { a: 1 })).toBe(false);
  expect(same({ a: 1 }, Object.defineProperty({ b: 2 }, "a", { value: 1 }))).toBe(false);
  expect(same({ child: { a: undefined } }, { child: { b: undefined } })).toBe(false);
});

test("record equality ignores prototypes and non-enumerable properties", () => {
  const plain = { a: 1, b: 2 };
  const withoutPrototype = Object.assign(Object.create(null), { b: 2, a: 1 });
  expect(eq(plain, withoutPrototype)).toBe(true);
  expect(eq(plain, Object.assign(Object.create({ inherited: 3 }), { a: 1, b: 2 }))).toBe(true);
  expect(eq(plain, Object.defineProperty({ a: 1, b: 2 }, "hidden", { value: 3 }))).toBe(true);
  expect(eq({ hasOwnProperty: 1 }, { hasOwnProperty: 1 })).toBe(true);
  expect(eq({ propertyIsEnumerable: 1 }, { propertyIsEnumerable: 1 })).toBe(true);
});

test("map is curried and immutable", () => {
  expect(map((x: number) => x * 2, [1, 2, 3])).toEqual([2, 4, 6]);
});

test("Option ctors match the runtime tag shape", () => {
  expect(Some(1)).toEqual({ _tag: "Some", value: 1 });
  expect(None).toEqual({ _tag: "None" });
});

test("dedupeBy preserves the previous equality model for mixed keys", () => {
  const key = fc.oneof(fc.jsonValue(), fc.constant(undefined), fc.constant(NaN), fc.constant(-0));
  fc.assert(
    fc.property(fc.array(key, { maxLength: 30 }), (keys) => {
      const seen: unknown[] = [];
      const expected = keys.filter((k) => {
        if (seen.some((s) => eq(s, k))) return false;
        seen.push(k);
        return true;
      });
      const actual = _Array_dedupeBy((k) => k, keys);
      expect(actual.length).toBe(expected.length);
      actual.forEach((k, i) => {
        expect(Object.is(k, expected[i])).toBe(true);
      });
    }),
    { numRuns: 200 },
  );
});

test("dedupeBy keeps NaNs and the first signed-zero representative", () => {
  const result = _Array_dedupeBy((x) => x, [NaN, -0, NaN, 0, -0]);
  expect(result.length).toBe(3);
  expect(Number.isNaN(result[0])).toBe(true);
  expect(Object.is(result[1], -0)).toBe(true);
  expect(Number.isNaN(result[2])).toBe(true);
  const f = () => 1;
  const g = () => 1;
  expect(_Array_dedupeBy((x) => x, [f, f, g])).toEqual([f, g]);
  const symbol = Symbol("key");
  expect(_Array_dedupeBy((x) => x, [symbol, symbol])).toEqual([symbol]);
  expect(_Array_dedupeBy((x) => x, [1n, 1n, 2n])).toEqual([1n, 2n]);
});

test("dedupeBy preserves projection and structural getter order", () => {
  const events: string[] = [];
  const keys = [
    0,
    {
      get value() {
        events.push("left");
        return 1;
      },
    },
    "key",
    {
      get value() {
        events.push("right");
        return 1;
      },
    },
  ];
  const result = _Array_dedupeBy(
    (i) => {
      events.push(`project:${i}`);
      return keys[i];
    },
    [0, 1, 2, 3],
  );
  expect(result).toEqual([0, 1, 2]);
  expect(events).toEqual(["project:0", "project:1", "project:2", "project:3", "left", "right"]);
});

test("dedupeBy visits present slots once and observes projection mutations", () => {
  const sparse = new Array<undefined>(4);
  sparse[1] = undefined;
  sparse[3] = undefined;
  let calls = 0;
  expect(
    _Array_dedupeBy((x) => {
      calls += 1;
      return x;
    }, sparse),
  ).toEqual([undefined]);
  expect(calls).toBe(2);
  const xs = [1, 2, 3];
  const visited: number[] = [];
  expect(
    _Array_dedupeBy((x) => {
      visited.push(x);
      xs[2] = 1;
      return x;
    }, xs),
  ).toEqual([1, 2]);
  expect(visited).toEqual([1, 2, 1]);
});
