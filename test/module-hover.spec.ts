// Module-aware hover: a file that imports a variant must still typecheck (so
// hover works at all) and report types that mention the imported type. Without
// the dep registry the file fails `check` and hover is null everywhere.
import { expect, test } from "bun:test";
import { hoverAt, moduleHoverAt } from "../src/hover";

const DEP = "/proj/ast.mochi";
const ENTRY = "/proj/main.mochi";
const DEP_SRC = "export type E =\n  | A(int)\n  | B\n";

const read =
  (src: Record<string, string>) =>
  (p: string): Promise<string> => {
    const hit = src[p];
    return hit === undefined
      ? Promise.reject(new Error(`no such file ${p}`))
      : Promise.resolve(hit);
  };

test("hover works inside a file that matches on an imported variant", async () => {
  //          0         1         2         3
  //          0123456789012345678901234567890123456789
  const src = 'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const nOff = src.indexOf("A(n)") + 2; // the binding `n` inside A(n)
  const info = await moduleHoverAt(ENTRY, src, nOff, read({ [DEP]: DEP_SRC }));
  expect(info?.code).toBe("(parameter) n: number");

  // Guard rail: single-file hover is null everywhere here — the file doesn't
  // typecheck because `A`/`B` are unknown without the dep registry.
  expect(hoverAt(src, nOff)).toBeNull();
});

test("hover on the scrutinee reports the imported variant type", async () => {
  const src = 'import { A, B } from "./ast.mochi"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const eOff = src.indexOf("switch e") + 7; // the `e` after `switch`
  const info = await moduleHoverAt(ENTRY, src, eOff, read({ [DEP]: DEP_SRC }));
  expect(info?.code).toContain("E");
});

test("degrades to single-file hover when the dep graph can't be resolved", async () => {
  const src = "let f = (x) => add(x, 1)";
  const info = await moduleHoverAt(ENTRY, src, 16, read({})); // on `add`, no imports
  expect(info?.code).toBe("number -> number -> number");
});
