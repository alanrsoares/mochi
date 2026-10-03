import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  definitionAt,
  highlightsAt,
  moduleDefinitionAt,
  prepareRenameAt,
  referencesAt,
  renameAt,
} from "@mochi/dx/nav";
import { documentSymbolsFromSource } from "@mochi/dx/symbol-query";
import { pos } from "@mochi/test-support";

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

test("moduleDefinitionAt follows an imported bootstrap graph binding", async () => {
  const dep = "/proj/dep.mochi";
  const entry = "/proj/main.mochi";
  const depSrc = "export let answer = 42";
  const src = 'import { answer } from "./dep"\nlet result = answer';
  const read = (path: string): Promise<string> =>
    resolve(path) === resolve(dep)
      ? Promise.resolve(depSrc)
      : Promise.reject(new Error(`no such file ${path}`));
  const def = await moduleDefinitionAt(entry, src, pos(src, "answer", 1), read);
  expect(def?.path).toBe(resolve(dep));
  expect(depSrc.slice(def!.span.start, def!.span.end)).toBe("answer");
});

test("bootstrap document symbols preserve declaration spans", () => {
  const src =
    'export let answer = 42\nexport type Shape = | Circle(number)\nextern host : number = "m" "x"';
  expect(documentSymbolsFromSource(src)).toEqual([
    { name: "answer", kind: "let", span: { start: 11, end: 17 } },
    { name: "Shape", kind: "type", span: { start: 35, end: 40 } },
    { name: "Circle", kind: "ctor", span: { start: 45, end: 51 }, detail: "Shape" },
    { name: "host", kind: "extern", span: { start: 67, end: 71 } },
  ]);
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

test("highlightsAt keeps a shadowing let distinct from the outer one", () => {
  const src = "let x = 1\nlet f = let x = 2 in x\nlet g = x";
  expect(highlightsAt(src, pos(src, "x", 1)).map((h) => h.span.start)).toEqual([22, 31]);
  expect(highlightsAt(src, pos(src, "x", 3)).map((h) => h.span.start)).toEqual([4, 41]);
});

test("highlightsAt binds a lambda parameter from its own span", () => {
  const src = "let f = a => a + 1";
  expect(highlightsAt(src, pos(src, "a"))).toEqual([
    { span: { start: 8, end: 9 }, role: "def" },
    { span: { start: 13, end: 14 }, role: "use" },
  ]);
});

test("highlightsAt resolves nothing off a binding, and survives a lex error", () => {
  expect(highlightsAt("let x = 1", 0)).toEqual([]);
  expect(highlightsAt("let x = @", 4)).toEqual([]);
});

test("referencesAt reports every use of a local, with an absolute path", () => {
  const src = "let f = a => a + a";
  expect(referencesAt(src, pos(src, "a"), "/t.mochi")).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 8, end: 9 } }, role: "def" },
    { location: { path: resolve("/t.mochi"), span: { start: 13, end: 14 } }, role: "use" },
    { location: { path: resolve("/t.mochi"), span: { start: 17, end: 18 } }, role: "use" },
  ]);
});

test("prepareRenameAt offers the name under the cursor, and refuses parked names", () => {
  const src = "let f = a => a + 1";
  expect(prepareRenameAt(src, pos(src, "a", 1))).toEqual({
    span: { start: 13, end: 14 },
    name: "a",
  });
  const parked = "let f = _x => _x";
  expect(prepareRenameAt(parked, pos(parked, "_x"))).toBeNull();
});

test("renameAt rewrites the binding's occurrences and no others", () => {
  const src = "let x = 1\nlet f = let x = 2 in x + 1";
  expect(renameAt(src, pos(src, "x", 1), "y", "/t.mochi")).toEqual([
    { location: { path: resolve("/t.mochi"), span: { start: 22, end: 23 } }, newText: "y" },
    { location: { path: resolve("/t.mochi"), span: { start: 31, end: 32 } }, newText: "y" },
  ]);
});

test("renameAt on a labeled parameter rewrites only its name", () => {
  const src = "let f = (~size: number = 1) => size";
  const edits = renameAt(src, pos(src, "size"), "n", "/t.mochi");
  expect(edits?.map((e) => src.slice(e.location.span.start, e.location.span.end))).toEqual([
    "size",
    "size",
  ]);
});
