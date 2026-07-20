// Property-based tests for hover. Two invariants: hover is *total* (never
// throws, always returns a HoverInfo or null) for arbitrary input at arbitrary
// offsets, and a numeric literal always hovers as `number` regardless of its
// value or surrounding whitespace.
import { expect, test } from "bun:test";
import fc from "fast-check";
import { hoverAt } from "../src/hover";

test("hover is total: HoverInfo | null for any source and offset, never throws", () => {
  fc.assert(
    fc.property(fc.string(), fc.nat(), (src, offset) => {
      const r = hoverAt(src, offset);
      expect(r === null || typeof r.code === "string").toBe(true);
    }),
  );
});

test("a numeric literal always hovers as number", () => {
  fc.assert(
    fc.property(fc.nat(), fc.nat({ max: 6 }), (n, pad) => {
      const gap = " ".repeat(pad);
      const src = `let v =${gap} ${n}`;
      // offset of the first digit: after "let v =" + gap + one space
      const at = "let v =".length + gap.length + 1;
      expect(hoverAt(src, at)?.code).toBe("number");
    }),
  );
});
