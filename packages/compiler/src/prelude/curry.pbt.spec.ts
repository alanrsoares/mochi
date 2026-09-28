// `_curry` takes fast paths for saturated and one-short calls at arities 2 and
// 3 (ADR 0115). Whatever the grouping, the result must be the one plain call:
// every split of the arguments into calls, over-application included, and
// `undefined` arguments (unit) counted as arguments rather than as gaps.
import { expect, test } from "bun:test";
import { _curry } from "@mochi/compiler/runtime";
import fc from "fast-check";

type Fn = (...args: unknown[]) => unknown;

/** Apply `g` to `args` in the given group sizes, one call per group. */
const applyGroups = (g: Fn, args: unknown[], sizes: number[]): unknown => {
  let acc: unknown = g;
  let i = 0;
  for (const k of sizes) {
    acc = (acc as Fn)(...args.slice(i, i + k));
    i += k;
  }
  return acc;
};

/** Group sizes (each at least 1) that add up to `total`. */
const groupings = (total: number) =>
  fc.array(fc.integer({ min: 1, max: total }), { minLength: 1, maxLength: total }).map((xs) => {
    const sizes: number[] = [];
    let left = total;
    for (const x of xs) {
      if (left === 0) break;
      const k = Math.min(x, left);
      sizes.push(k);
      left -= k;
    }
    if (left > 0) sizes.push(left);
    return sizes;
  });

const arg = fc.oneof(fc.integer(), fc.constant(undefined), fc.string({ maxLength: 3 }));

test("any grouping of a saturated call gives the plain call", () => {
  fc.assert(
    fc.property(
      fc
        .integer({ min: 1, max: 7 })
        .chain((n) =>
          fc.tuple(fc.constant(n), fc.array(arg, { minLength: n, maxLength: n }), groupings(n)),
        ),
      ([n, args, sizes]) => {
        const f = (...xs: unknown[]) => xs;
        expect(applyGroups(_curry(n, f), args, sizes)).toEqual(args);
      },
    ),
  );
});

test("extra arguments go on to the result, itself curried", () => {
  fc.assert(
    fc.property(
      fc
        .integer({ min: 1, max: 5 })
        .chain((n) =>
          fc.tuple(
            fc.constant(n),
            fc.array(arg, { minLength: n + 2, maxLength: n + 2 }),
            groupings(n + 2),
          ),
        ),
      ([n, args, sizes]) => {
        const f = (...xs: unknown[]) => _curry(2, (y: unknown, z: unknown) => [...xs, y, z]);
        expect(applyGroups(_curry(n, f), args, sizes)).toEqual(args);
      },
    ),
  );
});
