import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { definitionAt, highlightsAt, prepareRenameAt, referencesAt } from "../src/nav";

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

test("definitionAt on p.x jumps to the record-alias field", () => {
  const src = "type Point = { x: number, y: number }\nlet p = { x: 1, y: 2 }\nlet d = p.x";
  const def = definitionAt(src, pos(src, "x", 2), "/t.mochi"); // p.x
  expect(def?.path).toBe(resolve("/t.mochi"));
  // Alias field `x` is the first `x` after `type Point = { `.
  expect(def?.span.start).toBe(pos(src, "x"));
  expect(src.slice(def!.span.start, def!.span.end)).toBe("x");
});

test("highlightsAt marks alias def + literal + access for a field", () => {
  const src = "type Point = { x: number, y: number }\nlet p = { x: 1, y: 2 }\nlet d = p.x";
  const hs = highlightsAt(src, pos(src, "x", 2), "/t.mochi");
  expect(hs.map((h) => h.role)).toEqual(["def", "use", "use"]);
  expect(hs[0]!.span.start).toBe(pos(src, "x"));
});

test("referencesAt lists every same-name field site", () => {
  const src = "type Point = { x: number }\nlet p = { x: 1 }\nlet d = p.x";
  const refs = referencesAt(src, pos(src, "x", 2), "/t.mochi");
  expect(refs).toHaveLength(3);
  expect(refs.filter((r) => r.role === "def")).toHaveLength(1);
});

test("field access without an alias still indexes the literal as def", () => {
  const src = "let p = { x: 1 }\nlet d = p.x";
  const def = definitionAt(src, pos(src, "x", 1), "/t.mochi");
  expect(def?.span.start).toBe(pos(src, "x"));
});

test("prepareRenameAt refuses field names (file-wide name heuristic)", () => {
  const src = "type Point = { x: number }\nlet d = p.x";
  expect(prepareRenameAt(src, pos(src, "x", 1), "/t.mochi")).toBeNull();
});

test("prelude Result.map still wins over a record field named map", () => {
  const src = "let f = Result.map(identity)";
  const def = definitionAt(src, pos(src, "map"), "/t.mochi");
  expect(def?.path).toBe("mochi:/prelude.mochi");
});
