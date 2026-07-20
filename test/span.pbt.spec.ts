// Property-based tests for the offset → line/col machinery.
import { expect, test } from "bun:test";
import fc from "fast-check";
import { lineCol } from "../src/span";

test("line and col are always >= 1", () => {
  fc.assert(
    fc.property(fc.string(), fc.nat(), (src, offset) => {
      const { line, col } = lineCol(src, offset);
      expect(line).toBeGreaterThanOrEqual(1);
      expect(col).toBeGreaterThanOrEqual(1);
    }),
  );
});

test("offset 0 is always 1:1", () => {
  fc.assert(
    fc.property(fc.string(), (src) => {
      expect(lineCol(src, 0)).toEqual({ line: 1, col: 1 });
    }),
  );
});

test("line number is monotonic non-decreasing in offset", () => {
  fc.assert(
    fc.property(fc.string(), fc.nat(), fc.nat(), (src, a, b) => {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      expect(lineCol(src, lo).line).toBeLessThanOrEqual(lineCol(src, hi).line);
    }),
  );
});

test("line count equals number of newlines before the offset, plus one", () => {
  fc.assert(
    fc.property(fc.string(), fc.nat(), (src, offset) => {
      const n = Math.min(offset, src.length);
      const newlines = src.slice(0, n).split("\n").length - 1;
      expect(lineCol(src, offset).line).toBe(newlines + 1);
    }),
  );
});

test("advancing past a newline resets col to 1", () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (a, b) => {
      // char right after the "\n" is column 1
      const src = `${a}\n${b}`;
      expect(lineCol(src, a.length + 1).col).toBe(1);
    }),
  );
});
