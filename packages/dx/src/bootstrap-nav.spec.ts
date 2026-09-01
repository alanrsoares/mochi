import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  bootstrapBindingIsFileLocal,
  bootstrapHighlightsAt,
  bootstrapPrepareRenameAt,
  bootstrapReferencesAt,
  bootstrapRenameAt,
} from "@mochi/dx/bootstrap-nav";
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

test("bootstrapReferencesAt reports the def and every use, with an absolute path", () => {
  const src = "let f = a => a + a";
  expect(bootstrapReferencesAt(src, pos(src, "a"), "/t.mochi")).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 8, end: 9 } }, role: "def" },
    { location: { path: resolve("/t.mochi"), span: { start: 13, end: 14 } }, role: "use" },
    { location: { path: resolve("/t.mochi"), span: { start: 17, end: 18 } }, role: "use" },
  ]);
});

test("bootstrapPrepareRenameAt offers the name under the cursor", () => {
  const src = "let f = a => a + 1";
  expect(bootstrapPrepareRenameAt(src, pos(src, "a", 1))).toEqual({
    span: { start: 13, end: 14 },
    name: "a",
  });
});

test("bootstrapPrepareRenameAt refuses compiler-owned and unused binders", () => {
  const underscore = "let f = _x => 1";
  expect(bootstrapPrepareRenameAt(underscore, pos(underscore, "_x"))).toBeNull();
  expect(bootstrapPrepareRenameAt("let f = a => a", 0)).toBeNull();
});

test("bootstrapRenameAt rewrites the binding's occurrences and no others", () => {
  const src = "let x = 1\nlet f = let x = 2 in x + 1";
  const edits = bootstrapRenameAt(src, pos(src, "x", 1), "y", "/t.mochi");
  expect(edits).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 22, end: 23 } }, newText: "y" },
    { location: { path: resolve("/t.mochi"), span: { start: 31, end: 32 } }, newText: "y" },
  ]);
});

test("bootstrapBindingIsFileLocal separates a local binder from a top-level let", () => {
  const src = "let x = 1\nlet f = a => a + x";
  expect(bootstrapBindingIsFileLocal(src, pos(src, "a"))).toBe(true);
  expect(bootstrapBindingIsFileLocal(src, pos(src, "x"))).toBe(false);
  expect(bootstrapBindingIsFileLocal(src, 0)).toBe(false);
});
