import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  bootstrapBindingAt,
  bootstrapHighlightsAt,
  bootstrapHighlightsOf,
  bootstrapPrepareRenameOf,
  bootstrapReferencesOf,
  bootstrapRenameOf,
} from "@mochi/dx/bootstrap-nav";
import { highlightsAt } from "@mochi/dx/nav";
import { pos } from "@mochi/test-support";

/** Every query below reads one resolved binding; resolving is the only parse. */
const bindingAt = (src: string, offset: number) => {
  const binding = bootstrapBindingAt(src, offset);
  if (!binding) throw new Error(`no bootstrap binding at offset ${offset}`);
  return binding;
};

test("bootstrapHighlightsAt spans every occurrence of the binding under the cursor", () => {
  const src = "let x = 1\nlet y = x + x";
  expect(bootstrapHighlightsAt(src, pos(src, "x"))).toEqual([
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

test("bootstrapHighlightsOf binds a lambda parameter from its own span", () => {
  const src = "let f = a => a + 1";
  expect(bootstrapHighlightsOf(bindingAt(src, pos(src, "a")))).toEqual([
    { span: { start: 8, end: 9 }, role: "def" },
    { span: { start: 13, end: 14 }, role: "use" },
  ]);
});

test("bootstrapHighlightsAt agrees with the TypeScript query on a plain let", () => {
  const src = "let x = 1\nlet y = x + x";
  expect(bootstrapHighlightsAt(src, pos(src, "x"))).toEqual(highlightsAt(src, pos(src, "x")));
});

test("bootstrapBindingAt resolves nothing off a binding, and survives a lex error", () => {
  expect(bootstrapBindingAt("let x = 1", 0)).toBeNull();
  expect(bootstrapBindingAt("let x = @", 4)).toBeNull();
  expect(bootstrapHighlightsAt("let x = @", 4)).toEqual([]);
});

test("bootstrapReferencesOf reports the def and every use, with an absolute path", () => {
  const src = "let f = a => a + a";
  expect(bootstrapReferencesOf(bindingAt(src, pos(src, "a")), "/t.mochi")).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 8, end: 9 } }, role: "def" },
    { location: { path: resolve("/t.mochi"), span: { start: 13, end: 14 } }, role: "use" },
    { location: { path: resolve("/t.mochi"), span: { start: 17, end: 18 } }, role: "use" },
  ]);
});

test("bootstrapPrepareRenameOf offers the name under the cursor", () => {
  const src = "let f = a => a + 1";
  expect(bootstrapPrepareRenameOf(bindingAt(src, pos(src, "a", 1)))).toEqual({
    span: { start: 13, end: 14 },
    name: "a",
  });
});

test("bootstrapPrepareRenameOf refuses compiler-owned and unused binders", () => {
  const src = "let f = _x => _x";
  expect(bootstrapPrepareRenameOf(bindingAt(src, pos(src, "_x")))).toBeNull();
});

test("bootstrapRenameOf rewrites the binding's occurrences and no others", () => {
  const src = "let x = 1\nlet f = let x = 2 in x + 1";
  expect(bootstrapRenameOf(bindingAt(src, pos(src, "x", 1)), "y", "/t.mochi")).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 22, end: 23 } }, newText: "y" },
    { location: { path: resolve("/t.mochi"), span: { start: 31, end: 32 } }, newText: "y" },
  ]);
});

test("a resolved binding knows whether it is confined to this file", () => {
  const src = "let x = 1\nlet f = a => a + x";
  expect(bindingAt(src, pos(src, "a")).fileLocal).toBe(true);
  expect(bindingAt(src, pos(src, "x")).fileLocal).toBe(false);
});
