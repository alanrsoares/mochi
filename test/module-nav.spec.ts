import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  documentSymbolsAt,
  moduleDefinitionAt,
  moduleReferencesAt,
  moduleRenameAt,
  workspaceSymbolsAt,
} from "../src/nav";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = resolve(root, "examples/modules");
const mainPath = resolve(modules, "main.mochi");
const geomPath = resolve(modules, "geometry.mochi");
const read = (p: string) => readFile(p, "utf8");

test("moduleDefinitionAt jumps import use to export file", async () => {
  const src = await read(mainPath);
  // Real call site (comment text also contains `area(circle)`).
  const use = src.lastIndexOf("area(circle)");
  const def = await moduleDefinitionAt(mainPath, src, use, read);
  expect(def?.path).toBe(geomPath);
  const geom = await read(geomPath);
  expect(def?.span.start).toBe(geom.indexOf("export let area") + "export let ".length);
});

test("moduleDefinitionAt on import name goes to export", async () => {
  const src = await read(mainPath);
  const imp = src.indexOf("area, hypot");
  const def = await moduleDefinitionAt(mainPath, src, imp, read);
  expect(def?.path).toBe(geomPath);
});

test("moduleReferencesAt spans importer and exporter", async () => {
  const src = await read(mainPath);
  const use = src.indexOf("hypot(");
  const refs = await moduleReferencesAt(mainPath, src, use, read);
  const paths = [...new Set(refs.map((r) => r.location.path))];
  expect(paths).toContain(mainPath);
  expect(paths).toContain(geomPath);
  expect(refs.some((r) => r.role === "def")).toBe(true);
});

test("moduleRenameAt rewrites export and import sites", async () => {
  const src = await read(mainPath);
  const use = src.indexOf("hypot(");
  const edits = await moduleRenameAt(mainPath, src, use, "hyp", read);
  expect(edits).not.toBeNull();
  const byPath = new Map<string, number>();
  for (const e of edits!) {
    expect(e.newText).toBe("hyp");
    byPath.set(e.location.path, (byPath.get(e.location.path) ?? 0) + 1);
  }
  expect(byPath.get(geomPath)).toBeGreaterThanOrEqual(1);
  expect(byPath.get(mainPath)).toBeGreaterThanOrEqual(1);
});

test("documentSymbolsAt lists top-level decls", async () => {
  const geom = await read(geomPath);
  const syms = documentSymbolsAt(geom);
  expect(syms.map((s) => s.name)).toContain("area");
  expect(syms.map((s) => s.name)).toContain("Shape");
  expect(syms.map((s) => s.name)).toContain("Circle");
});

test("workspaceSymbolsAt finds across the graph", async () => {
  const main = await read(mainPath);
  const hits = await workspaceSymbolsAt(mainPath, "hyp", read, main);
  expect(hits.some((h) => h.name === "hypot" && h.path === geomPath)).toBe(true);
});
