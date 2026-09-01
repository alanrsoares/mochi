import { expect, test } from "bun:test";
import { bootstrapHighlightsAt } from "@mochi/dx/bootstrap-highlights";
import { highlightsAt } from "@mochi/dx/nav";
import { pos } from "@mochi/test-support";

test("bootstrapHighlightsAt spans every occurrence of the binding under the cursor", () => {
  const src = "let x = 1\nlet y = x + x";
  const hits = bootstrapHighlightsAt(src, pos(src, "x"));
  expect(hits).toEqual([
    { span: { start: 4, end: 5 }, role: "def" },
    { span: { start: 18, end: 19 }, role: "use" },
    { span: { start: 22, end: 23 }, role: "use" },
  ]);
});

test("bootstrapHighlightsAt keeps a shadowing let distinct from the outer one", () => {
  const src = "let x = 1\nlet f = let x = 2 in x\nlet g = x";
  const inner = bootstrapHighlightsAt(src, pos(src, "x", 1));
  expect(inner.map((h) => h.span.start)).toEqual([22, 31]);
  const outer = bootstrapHighlightsAt(src, pos(src, "x", 3));
  expect(outer.map((h) => h.span.start)).toEqual([4, 41]);
});

test("bootstrapHighlightsAt binds a lambda parameter from its own span", () => {
  const src = "let f = a => a + 1";
  const hits = bootstrapHighlightsAt(src, pos(src, "a"));
  expect(hits).toEqual([
    { span: { start: 8, end: 9 }, role: "def" },
    { span: { start: 13, end: 14 }, role: "use" },
  ]);
});

test("bootstrapHighlightsAt agrees with the TypeScript query on a plain let", () => {
  const src = "let x = 1\nlet y = x + x";
  expect(bootstrapHighlightsAt(src, pos(src, "x"))).toEqual(highlightsAt(src, pos(src, "x")));
});

test("bootstrapHighlightsAt returns nothing off a binding, and survives a lex error", () => {
  expect(bootstrapHighlightsAt("let x = 1", 0)).toEqual([]);
  expect(bootstrapHighlightsAt("let x = @", 4)).toEqual([]);
});
