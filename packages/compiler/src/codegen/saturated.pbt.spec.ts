// Saturated calls to a top-level function lower to its raw twin (ADR 0149).
// Whatever the call shape, the result must equal the one curried-path call: the
// twin is an optimisation, never a different function.
import { expect, test } from "bun:test";
import { compileAndEval } from "@mochi/test-support";
import fc from "fast-check";

type Fn = (...args: number[]) => unknown;
type Fns = Readonly<Record<"mix" | "viaTwin" | "viaPipe" | "viaPartial" | "sum" | "sumTwice", Fn>>;

/** One call of `f`; chained calls model each regrouping of the arguments. */
const call = (f: unknown, ...args: number[]): unknown => (f as Fn)(...args);

const src = `let mix = (a, b, c) => a * 100 + b * 10 - c
let viaTwin = (a, b, c) => mix(a, b, c)
let viaPipe = (a, b, c) => a->mix(b, c)
let viaPartial = a => mix(a)
let sum = (n, acc) => n == 0 ? acc : sum(n - 1, acc + n)
let sumTwice = n => sum(n, 0) + sum(n, 0)`;

const fns = compileAndEval(src, "{ mix, viaTwin, viaPipe, viaPartial, sum, sumTwice }") as Fns;

const int = fc.integer({ min: 0, max: 1000 });

test("saturated, piped, partial and regrouped calls of one function agree", () => {
  const { mix, viaTwin, viaPipe, viaPartial } = fns;
  fc.assert(
    fc.property(int, int, int, (a, b, c) => {
      const plain = a * 100 + b * 10 - c;
      expect(viaTwin(a, b, c)).toBe(plain);
      expect(viaPipe(a, b, c)).toBe(plain);
      expect(mix(a, b, c)).toBe(plain);
      expect(call(call(mix, a), b, c)).toBe(plain);
      expect(call(call(mix, a, b), c)).toBe(plain);
      expect(call(call(call(mix, a), b), c)).toBe(plain);
      expect(call(viaPartial(a), b, c)).toBe(plain);
    }),
  );
});

test("a self-recursive twin agrees with the closed form", () => {
  const { sum, sumTwice } = fns;
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 200 }), (n) => {
      const closed = (n * (n + 1)) / 2;
      expect(sum(n, 0)).toBe(closed);
      expect(call(call(sum, n), 0)).toBe(closed);
      expect(sumTwice(n)).toBe(2 * closed);
    }),
  );
});
