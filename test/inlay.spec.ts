import { expect, test } from "bun:test";
import { inlayHints } from "../src/inlay";

test("a monomorphic binding gets a type inset after its name", () => {
  //          01234
  const src = "let n = add(1, 2)";
  expect(inlayHints(src)).toEqual([{ offset: 5, label: ": number" }]); // after `n`
});

test("a record binding shows the inferred row", () => {
  const src = "let r = { x: 1, y: 2 }";
  expect(inlayHints(src)).toEqual([{ offset: 5, label: ": { x: number, y: number }" }]);
});

test("one hint per top-level binding, at each name's end", () => {
  const src = "let a = 1\nlet b = add(a, pi)";
  const hints = inlayHints(src);
  expect(hints).toHaveLength(2);
  expect(hints[0]).toEqual({ offset: 5, label: ": number" }); // after `a`
  expect(hints[1]).toEqual({ offset: 15, label: ": number" }); // after `b` on line 1
});

test("a polymorphic binding shows an arrow scheme", () => {
  const src = "let id = (x) => x";
  const [h] = inlayHints(src);
  expect(h!.offset).toBe(6); // after `id`
  expect(h!.label).toMatch(/^: 't\d+ -> 't\d+$/);
});

test("no hints when the source does not typecheck", () => {
  expect(inlayHints("let bad = add(1, { x: 2 })")).toEqual([]);
});
