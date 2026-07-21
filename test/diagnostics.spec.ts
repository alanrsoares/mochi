import { expect, test } from "bun:test";
import { diagnostics } from "../src/diagnostics";

test("clean source produces no diagnostics", () => {
  expect(diagnostics("let n = add(mul(2, 3), 4)")).toEqual([]);
});

test("type error maps to a 0-based range on the offending expression", () => {
  const d = diagnostics("let bad = add(1, { x: 2 })");
  expect(d).toHaveLength(1);
  // record arg spans offsets 17..25 on line 0
  expect(d[0]!.range).toEqual({
    start: { line: 0, character: 17 },
    end: { line: 0, character: 25 },
  });
  expect(d[0]!.message).toStartWith("type:");
});

test("error on a later line reports the right line and column", () => {
  const d = diagnostics("let a = 1\nlet b = pi.x"); // pi : number, field on line 1
  expect(d).toHaveLength(1);
  expect(d[0]!.range.start).toEqual({ line: 1, character: 8 });
});

test("lex error maps to a single-char range", () => {
  const d = diagnostics("let x = ^");
  expect(d).toHaveLength(1);
  expect(d[0]!.range).toEqual({
    start: { line: 0, character: 8 },
    end: { line: 0, character: 9 },
  });
  expect(d[0]!.message).toBe("lex: unexpected char '^'");
});
