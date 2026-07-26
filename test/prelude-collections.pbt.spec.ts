// Property-based invariants for the structural `eq`/`compare`/`show` prelude
// runtime on Map/Set (C4 bug fix). Before the fix these deep-walked with
// `Object.keys`, which is `[]` for Map/Set — so `eq`/`compare` treated any two
// Maps/Sets as equal and `show` printed `"[object Map]"`. Exercises the raw
// runtime strings (`preludeJsDefs`) directly, since that's the single source
// shared by both the JS and typed-TS backends (`src/runtime.ts` is generated
// from the same bodies).
import { expect, test } from "bun:test";
import fc from "fast-check";
import { preludeJs } from "../src/prelude";

type Runtime = {
  eq: (a: unknown, b: unknown) => boolean;
  compare: (a: unknown, b: unknown) => number;
  show: (a: unknown) => string;
};

const rt = new Function(`${preludeJs}\nreturn { eq, compare, show };`)() as Runtime;
const { eq, compare, show } = rt;

const entry = fc.tuple(fc.string(), fc.integer());
const mapFixture = fc
  .uniqueArray(entry, { selector: (e) => e[0], minLength: 1, maxLength: 8 })
  .map((es) => new Map(es));
const setFixture = fc
  .uniqueArray(fc.integer(), { minLength: 1, maxLength: 8 })
  .map((xs) => new Set(xs));

test("eq(x, x) is true for Map and Set fixtures", () => {
  fc.assert(fc.property(mapFixture, (m) => expect(eq(m, m)).toBe(true)));
  fc.assert(fc.property(setFixture, (s) => expect(eq(s, s)).toBe(true)));
});

test("eq is false for structurally distinct Map fixtures", () => {
  fc.assert(
    fc.property(mapFixture, mapFixture, (a, b) => {
      fc.pre(a.size !== b.size || [...a.entries()].some(([k, v]) => !b.has(k) || b.get(k) !== v));
      expect(eq(a, b)).toBe(false);
    }),
  );
});

test("eq is false for structurally distinct Set fixtures", () => {
  fc.assert(
    fc.property(setFixture, setFixture, (a, b) => {
      fc.pre(a.size !== b.size || [...a].some((x) => !b.has(x)));
      expect(eq(a, b)).toBe(false);
    }),
  );
});

test("eq on Map/Set is order-independent (shuffled insertion still equal)", () => {
  fc.assert(
    fc.property(mapFixture, (m) => {
      const shuffled = new Map([...m.entries()].reverse());
      expect(eq(m, shuffled)).toBe(true);
    }),
  );
  fc.assert(
    fc.property(setFixture, (s) => {
      const shuffled = new Set([...s].reverse());
      expect(eq(s, shuffled)).toBe(true);
    }),
  );
});

test("compare(x, x) is 0, and compare is insertion-order independent", () => {
  fc.assert(
    fc.property(mapFixture, (m) => {
      expect(compare(m, m)).toBe(0);
      const shuffled = new Map([...m.entries()].reverse());
      expect(compare(m, shuffled)).toBe(0);
    }),
  );
  fc.assert(
    fc.property(setFixture, (s) => {
      expect(compare(s, s)).toBe(0);
      const shuffled = new Set([...s].reverse());
      expect(compare(s, shuffled)).toBe(0);
    }),
  );
});

test("show never falls back to the useless default Object display", () => {
  fc.assert(
    fc.property(mapFixture, (m) => {
      const s = show(m);
      expect(s).not.toContain("[object");
      expect(s.startsWith("#{")).toBe(true);
    }),
  );
  fc.assert(
    fc.property(setFixture, (s) => {
      const out = show(s);
      expect(out).not.toContain("[object");
      expect(out.startsWith("#{")).toBe(true);
    }),
  );
});
