import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { definitionAt, highlightsAt, prepareRenameAt, referencesAt, renameAt } from "../src/nav";

const pos = (src: string, name: string, n = 0): number => {
  let from = 0;
  for (let i = 0; i <= n; i++) {
    const idx = src.indexOf(name, from);
    if (idx < 0) throw new Error(`'${name}' #${i} not found`);
    if (i === n) return idx;
    from = idx + name.length;
  }
  throw new Error("unreachable");
};

test("definitionAt jumps from use to def", () => {
  const src = "let x = 1\nlet y = x";
  const def = definitionAt(src, pos(src, "x", 1), "/t.mochi");
  expect(def).toEqual({ path: resolve("/t.mochi"), span: { start: 4, end: 5 } });
});

test("definitionAt on the def site returns itself", () => {
  const src = "let x = 1\nlet y = x";
  const def = definitionAt(src, pos(src, "x"), "/t.mochi");
  expect(def?.span).toEqual({ start: 4, end: 5 });
});

test("definitionAt on a prelude name opens the virtual prelude", () => {
  const src = "let n = add(1, 2)";
  const def = definitionAt(src, pos(src, "add"));
  expect(def?.path).toBe("mochi:/prelude.mochi");
});

test("definitionAt works when the file does not typecheck", () => {
  // Unbound `z` — infer would fail; nav is lexical.
  const src = "let x = 1\nlet y = z(x)";
  const def = definitionAt(src, pos(src, "x", 1), "/t.mochi");
  expect(def?.span).toEqual({ start: 4, end: 5 });
});

test("highlightsAt marks def and uses", () => {
  const src = "let x = 1\nlet y = x\nlet z = x";
  const hs = highlightsAt(src, pos(src, "x", 1), "/t.mochi");
  expect(hs.map((h) => h.role)).toEqual(["def", "use", "use"]);
  expect(hs.map((h) => h.span.start)).toEqual([4, pos(src, "x", 1), pos(src, "x", 2)]);
});

test("highlightsAt respects shadowing", () => {
  const src = "let x = 1\nlet f = () => let x = 2 in x";
  const outer = highlightsAt(src, pos(src, "x"), "/t.mochi");
  const inner = highlightsAt(src, pos(src, "x", 2), "/t.mochi");
  expect(outer).toHaveLength(1);
  expect(inner.map((h) => h.role)).toEqual(["def", "use"]);
});

test("referencesAt lists def and uses", () => {
  const src = "let x = 1\nlet y = x\nlet z = x";
  const refs = referencesAt(src, pos(src, "x", 1), "/t.mochi");
  expect(refs.map((r) => r.role)).toEqual(["def", "use", "use"]);
});

test("prepareRenameAt rejects prelude names", () => {
  const src = "let n = add(1, 2)";
  expect(prepareRenameAt(src, pos(src, "add"))).toBeNull();
});

test("renameAt rewrites every occurrence", () => {
  const src = "let x = 1\nlet y = x";
  const edits = renameAt(src, pos(src, "x", 1), "w", "/t.mochi");
  expect(edits?.map((e) => e.newText)).toEqual(["w", "w"]);
  expect(edits?.map((e) => e.location.span.start)).toEqual([4, pos(src, "x", 1)]);
});

test("renameAt rejects invalid new names", () => {
  const src = "let x = 1";
  expect(renameAt(src, pos(src, "x"), "1bad")).toBeNull();
  expect(renameAt(src, pos(src, "x"), "$tmp")).toBeNull();
});
