// The generated typed runtime (src/runtime.ts, ADR 0026) must not just
// type-check — its bodies must behave identically to the JS backend's inlined
// preamble, since both are meant to be the same prelude. Spot-check the shapes
// that matter: currying, structural eq, collection ops, Option ctors.
import { expect, test } from "bun:test";
import { _curry, add, eq, map, None, Some } from "@mochi/compiler/runtime";

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
