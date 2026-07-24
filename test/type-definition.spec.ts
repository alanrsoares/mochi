import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { moduleTypeDefinitionAt, typeDefinitionAt } from "../src/nav";

/** Offset of the `n`th occurrence of whole-word-ish `name` (simple scan). */
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

test("typeDefinitionAt on a variant value jumps to the type decl", () => {
  const src = "type Shape =\n  | Circle(number)\nlet c = Circle(1)";
  // First `c` is inside Circle; the binding is the second.
  const def = typeDefinitionAt(src, pos(src, "c", 1), "/t.mochi");
  expect(def?.path).toBe(resolve("/t.mochi"));
  expect(def?.span.start).toBe(pos(src, "Shape"));
  expect(src.slice(def!.span.start, def!.span.end)).toBe("Shape");
});

test("typeDefinitionAt folds a record alias", () => {
  const src = "type Point = { x: number, y: number }\nlet p = { x: 1, y: 2 }";
  // Avoid the `p` inside `type` — bind at `let p`.
  const def = typeDefinitionAt(src, pos(src, "let p") + 4, "/t.mochi");
  expect(def?.span.start).toBe(pos(src, "Point"));
});

test("typeDefinitionAt on Option opens the virtual prelude", () => {
  const src = "let o = Some(1)";
  const def = typeDefinitionAt(src, pos(src, "o"));
  expect(def?.path).toBe("mochi:/prelude.mochi");
});

test("typeDefinitionAt returns null for primitives / structural records", () => {
  expect(typeDefinitionAt("let n = 1", pos("let n = 1", "n"))).toBeNull();
  const raw = "let p = { x: 1 }";
  expect(typeDefinitionAt(raw, pos(raw, "let p") + 4)).toBeNull();
});

test("typeDefinitionAt returns null when typecheck fails", () => {
  // Whole-program infer fails → no type table.
  const src = 'type Shape =\n  | Circle(number)\nlet c = Circle("no")';
  expect(typeDefinitionAt(src, pos(src, "c", 1), "/t.mochi")).toBeNull();
});

test("typeDefinitionAt returns null for arrows / arrays without a type binding", () => {
  const fn = "let f = x => x";
  expect(typeDefinitionAt(fn, pos(fn, "f"))).toBeNull();
  const arr = "let xs = [1, 2]";
  expect(typeDefinitionAt(arr, pos(arr, "xs"))).toBeNull();
});

test("moduleTypeDefinitionAt follows an imported variant", async () => {
  const DEP = "/proj/ast.mochi";
  const ENTRY = "/proj/main.mochi";
  const DEP_SRC = "export type Shape =\n  | Circle(number)\n";
  // Import ctors only — the type name need not be imported for go-to-type.
  const src = 'import { Circle } from "./ast.mochi"\nlet c = Circle(1)';
  const read = (p: string): Promise<string> =>
    resolve(p) === resolve(DEP)
      ? Promise.resolve(DEP_SRC)
      : Promise.reject(new Error(`no such file ${p}`));
  const def = await moduleTypeDefinitionAt(ENTRY, src, pos(src, "let c") + 4, read);
  expect(def?.path).toBe(resolve(DEP));
  expect(DEP_SRC.slice(def!.span.start, def!.span.end)).toBe("Shape");
});
