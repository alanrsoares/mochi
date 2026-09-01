import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { bootstrapDocumentSymbolsAt } from "@mochi/dx/bootstrap-symbols";
import {
  definitionAt,
  highlightsAt,
  moduleDefinitionAt,
  prepareRenameAt,
  referencesAt,
  renameAt,
} from "@mochi/dx/nav";
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
  expect(bootstrapDocumentSymbolsAt(src)).toEqual([
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
