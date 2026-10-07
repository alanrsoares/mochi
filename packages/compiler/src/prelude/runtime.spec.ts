// The generated typed runtime (src/runtime.ts, ADR 0026) must not just
// type-check — its bodies must behave identically to the JS backend's inlined
// preamble, since both are meant to be the same prelude. Spot-check the shapes
// that matter: currying, structural eq, collection ops, Option ctors.
import { expect, test } from "bun:test";
import {
  _Array_dedupeBy,
  _curry,
  _Dict_empty,
  _Dict_entries,
  _Dict_fromEntries,
  _Dict_get,
  _Dict_remove,
  _Dict_set,
  _Dict_size,
  _Map_fromEntries,
  _Map_get,
  _Map_set,
  _Option_match,
  _Result_match,
  _Set_fromArray,
  _Set_size,
  add,
  compare,
  eq,
  map,
  None,
  Some,
  show,
} from "@mochi/compiler/runtime";
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

test("record equality compares shared fields before key counts", () => {
  // Pinned order: fields are walked first, so a mismatched shape still reaches
  // a differing shared field (false) and reads each getter at most once.
  let reads = 0;
  const probe = {
    get a() {
      reads += 1;
      return 1;
    },
  };
  const same = (left: Record<string, unknown>, right: Record<string, unknown>): boolean =>
    eq(left, right);
  expect(same(probe, { a: 2, b: 3 })).toBe(false);
  expect(reads).toBe(1);
  expect(same({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  expect(same({ a: 1 }, { a: 1, b: 2 })).toBe(false);
});

test("map is curried and immutable", () => {
  expect(map((x: number) => x * 2, [1, 2, 3])).toEqual([2, 4, 6]);
});

test("record ordering is numeric, recursive, and independent of field insertion", () => {
  expect(compare({ a: 10 }, { a: 2 })).toBe(1);
  expect(compare({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(0);
  expect(compare({ child: { value: -10 } }, { child: { value: -2 } })).toBe(-1);
  expect(compare({ a: undefined }, { b: undefined })).toBe(-1);
  expect(compare({}, { a: undefined })).toBe(-1);
  expect(compare({ value: undefined }, { value: null })).toBe(-1);
  expect(compare({ value: null }, { value: 0 })).toBe(-1);
  expect(compare({ value: 0 }, { value: undefined })).toBe(1);
  expect(compare({ value: 0 }, { value: null })).toBe(1);
  expect(compare({ value: NaN }, { value: 2 })).toBe(0);
  expect(compare({ value: -0 }, { value: 0 })).toBe(0);
  expect(compare({ "2": 1, "10": 9 }, { "10": 0, "2": 2 })).toBe(1);
});

test("record ordering ignores inherited and hidden fields and does not call toJSON", () => {
  const plain = { a: 1, b: 2 };
  expect(compare(plain, Object.assign(Object.create(null), { b: 2, a: 1 }))).toBe(0);
  expect(compare(plain, Object.assign(Object.create({ inherited: 3 }), plain))).toBe(0);
  expect(compare(plain, Object.defineProperty({ ...plain }, "hidden", { value: 3 }))).toBe(0);
  expect(compare({ a: 1 }, Object.assign(Object.create({ a: 1 }), { b: 2 }))).toBe(-1);
  const withJSON = Object.defineProperty({ ...plain }, "toJSON", {
    value: () => {
      throw new Error("must not serialize");
    },
  });
  expect(compare(plain, withJSON)).toBe(0);
  expect(compare(plain, Object.assign(Object.create({ _tag: "A" }), plain))).toBe(0);
  expect(compare(plain, Object.defineProperty({ ...plain }, "_tag", { value: "A" }))).toBe(0);
});

test("variant ordering compares tags first, then positional and named payloads", () => {
  expect(compare({ z: 0, _tag: "A" }, { a: 0, _tag: "B" })).toBe(-1);
  expect(compare({ _tag: "N", _0: 10 }, { _0: 2, _tag: "N" })).toBe(1);
  expect(compare({ _tag: "N", _2: 1, _10: 9 }, { _tag: "N", _10: 0, _2: 2 })).toBe(-1);
  expect(compare({ _tag: "N", z: 9, a: 1 }, { a: 2, z: 0, _tag: "N" })).toBe(-1);
  expect(compare({ _tag: "N" }, {})).toBe(-1);
  expect(compare({}, { _tag: "N" })).toBe(1);
  expect(compare({ _tag: "N", value: { n: 10 } }, { _tag: "N", value: { n: 2 } })).toBe(1);
  expect(compare({ _tag: "N", _2: 1 }, { _tag: "N", _10: 1 })).toBe(-1);
  expect(compare({ _tag: "N", _0: 1 }, { _tag: "N", a: 1 })).toBe(-1);
  expect(
    compare({ named: 1, _tag: "N", _10: 2, _2: 3 }, { _2: 3, _10: 2, _tag: "N", named: 1 }),
  ).toBe(0);
});

test("structural comparison refuses reached lazy Lists without pulling them", () => {
  let pulls = 0;
  const list = () => ({
    *[Symbol.iterator]() {
      pulls += 1;
      yield 1;
    },
  });
  const a = list(),
    b = list();
  expect(() => compare({ values: a }, { values: b })).toThrow("compare on List");
  expect(() => compare({ _tag: "Box", value: a }, { _tag: "Box", value: b })).toThrow(
    "compare on List",
  );
  expect(() => compare({ values: {} }, { values: b })).toThrow("compare on List");
  expect(compare({ a: 1, values: a }, { a: 2, values: b })).toBe(-1);
  expect(compare({ values: a }, { values: a })).toBe(0);
  expect(pulls).toBe(0);
});

test("variant ordering reads tags once and only reaches selected payload fields", () => {
  const events: string[] = [];
  const item = (side: string, tag: string) => ({
    get _tag() {
      events.push(`${side}:tag`);
      return tag;
    },
    get value() {
      events.push(`${side}:value`);
      return 1;
    },
  });
  expect(compare(item("left", "A"), item("right", "B"))).toBe(-1);
  expect(events).toEqual(["left:tag", "right:tag"]);
  events.length = 0;
  expect(compare(item("left", "A"), item("right", "A"))).toBe(0);
  expect(events).toEqual(["left:tag", "right:tag", "left:value", "right:value"]);
});

test("record ordering reads the first field once when later fields decide", () => {
  const events: string[] = [];
  const item = (side: string, later: number) => ({
    get z() {
      events.push(`${side}:z`);
      return later;
    },
    get a() {
      events.push(`${side}:a`);
      return 1;
    },
  });
  expect(compare(item("left", 10), item("right", 2))).toBe(1);
  expect(events).toEqual(["left:a", "right:a", "left:z", "right:z"]);
});

test("Option ctors match the runtime tag shape", () => {
  expect(Some(1)).toEqual({ _tag: "Some", value: 1 });
  expect(None).toEqual({ _tag: "None" });
});

test("builtin match helpers dispatch only the selected callback and payload", () => {
  const events: string[] = [];
  const failure = (e: string) => {
    events.push(`error:${e}`);
    return 1;
  };
  const success = (n: number) => {
    events.push(`value:${n}`);
    return "success";
  };
  expect(_Result_match({ _tag: "Err", error: "oops" }, failure, success)).toBe(1);
  expect(_Result_match({ _tag: "Ok", value: 2 }, failure, success)).toBe("success");
  expect(
    _Option_match(
      None,
      () => {
        events.push("none");
        return 0;
      },
      success,
    ),
  ).toBe(0);
  expect(_Option_match(Some(3), () => 0, success)).toBe("success");
  expect(events).toEqual(["error:oops", "value:2", "none", "value:3"]);
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

test("dedupeBy hashing agrees with the eq scan on nested, mixed and unhashable keys", () => {
  const leaf = fc.oneof(
    fc.jsonValue(),
    fc.constant(undefined),
    fc.constant(NaN),
    fc.constant(-0),
    fc.constant(0),
    fc.bigInt(),
  );
  const key = fc.oneof(
    leaf,
    fc.array(leaf, { maxLength: 4 }),
    fc.dictionary(fc.constantFrom("a", "b", "c"), fc.oneof(leaf, fc.array(leaf, { maxLength: 3 }))),
    fc.constant(new Map([[1, 2]])),
    fc.constant(Object.assign(new Array(2), { 1: 1 })),
  );
  fc.assert(
    fc.property(fc.array(key, { maxLength: 24 }), (keys) => {
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
    { numRuns: 300 },
  );
});

test("dedupeBy keeps the eq scan's getter reads for unhashable keys beside hashed ones", () => {
  const events: string[] = [];
  const getter = (name: string, value: number) => ({
    get v() {
      events.push(name);
      return value;
    },
  });
  const keys: unknown[] = [{ v: 1 }, getter("g1", 1), { v: 2 }, getter("g2", 2), { v: 1 }];
  const result = _Array_dedupeBy((i: number) => keys[i], [0, 1, 2, 3, 4]);
  expect(result).toEqual([0, 2]);
  // Replays the plain scan: each getter key is read while compared against the
  // earlier retained keys, and the final {v:1} stops at its first match.
  const seen: unknown[] = [];
  const expectedEvents: string[] = [];
  events.length = 0;
  keys.forEach((k) => {
    if (!seen.some((s) => eq(s, k))) seen.push(k);
  });
  expectedEvents.push(...events);
  events.length = 0;
  _Array_dedupeBy((i: number) => keys[i], [0, 1, 2, 3, 4]);
  expect(events).toEqual(expectedEvents);
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

test("Dict ops are immutable and prototype-safe", () => {
  fc.assert(
    fc.property(
      fc.array(fc.tuple(fc.string(), fc.integer())),
      fc.string(),
      fc.integer(),
      (es, k, v) => {
        const d = _Dict_fromEntries(es);
        const before = _Dict_entries(d);
        const d2 = _Dict_set(k, v, d);
        expect(_Dict_entries(d)).toEqual(before);
        expect(_Dict_get(k, d2)).toEqual(Some(v));
        const d3 = _Dict_remove(k, d2);
        expect(_Dict_get(k, d3)).toEqual(None);
        expect(_Dict_size(d3)).toBe(_Dict_size(d) - (before.some(([x]) => x === k) ? 1 : 0));
        expect(eq(_Dict_fromEntries(_Dict_entries(d2)), d2)).toBe(true);
      },
    ),
  );
  expect(_Dict_get("__proto__", _Dict_empty)).toEqual(None);
  expect(_Dict_get("constructor", _Dict_set("x", 1, _Dict_empty))).toEqual(None);
});

test("show renders Dicts as plain data, never as variants", () => {
  expect(show(_Dict_empty)).toBe("{}");
  expect(show(_Dict_set("_tag", "x", _Dict_empty))).toBe('{ _tag: "x" }');
});

test("Map/Set treat eq object keys as one key; primitives and identity unchanged", () => {
  fc.assert(
    fc.property(fc.array(fc.tuple(fc.integer(), fc.integer())), (pairs) => {
      const distinct = new Set(pairs.map(([a, b]) => `${a},${b}`)).size;
      expect(_Set_size(_Set_fromArray(pairs.map(([a, b]) => [a, b])))).toBe(distinct);
      const m = pairs.reduce(
        (acc: Map<number[], number>, [a, b], i) => _Map_set([a, b], i, acc),
        new Map(),
      );
      expect(m.size).toBe(distinct);
      for (const [a, b] of pairs) expect(_Map_get([a, b], m)._tag).toBe("Some");
    }),
  );
  expect(_Set_size(_Set_fromArray([1, 1, 2]))).toBe(2);
});

test("compare treats a Dict _tag key as data; eq on Map/Set is structural", () => {
  const tagged: Record<string, string> = _Dict_set("_tag", "z", _Dict_empty);
  const upper: Record<string, string> = _Dict_set("A", "1", _Dict_empty);
  // As data "_tag" sorts after "A"; a variant-style compare would put it first.
  expect(compare(tagged, upper)).toBe(1);
  expect(compare(_Dict_set("_tag", "b", tagged), _Dict_set("_tag", "a", tagged))).toBe(1);
  expect(eq(new Map([[[1, 2], "a"]]), new Map([[[1, 2], "a"]]))).toBe(true);
  expect(eq(new Map([[[1, 2], "a"]]), new Map([[[1, 3], "a"]]))).toBe(false);
  expect(eq(new Set([[1], [2]]), new Set([[2], [1]]))).toBe(true);
  expect(eq(new Set([[1]]), new Set([[2]]))).toBe(false);
});

test("Map.fromEntries equals folding Map.set, including eq keys and key order", () => {
  const fold = (es: [unknown, number][]) =>
    es.reduce<Map<unknown, number>>((m, [k, v]) => _Map_set(k, v, m), new Map());
  const key = fc.oneof(
    fc.integer({ min: 0, max: 5 }),
    fc.string({ maxLength: 2 }),
    fc.record({ a: fc.integer({ min: 0, max: 2 }) }),
    fc.tuple(fc.integer({ min: 0, max: 2 }), fc.integer({ min: 0, max: 2 })),
  );
  fc.assert(
    fc.property(fc.array(fc.tuple(key, fc.integer()), { maxLength: 30 }), (es) => {
      const built = _Map_fromEntries(es);
      const folded = fold(es);
      expect<unknown[]>([...built.keys()]).toEqual([...folded.keys()]);
      expect<unknown[]>([...built.values()]).toEqual([...folded.values()]);
    }),
  );
});
