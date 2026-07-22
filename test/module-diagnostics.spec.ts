// Module-aware LSP diagnostics: a file that matches on an imported variant must
// NOT report "unknown constructor" (the bug), and cross-module exhaustiveness
// must be real. The dep is served from an in-memory map, so no disk is touched.
import { expect, test } from "bun:test";
import { diagnostics, moduleDiagnostics } from "../src/diagnostics";

const DEP = "/proj/ast.al";
const ENTRY = "/proj/main.al";
const DEP_SRC = "export type E =\n  | A(int)\n  | B\n";

const read =
  (src: Record<string, string>) =>
  (p: string): Promise<string> => {
    const hit = src[p];
    return hit === undefined
      ? Promise.reject(new Error(`no such file ${p}`))
      : Promise.resolve(hit);
  };

test("a switch on an imported variant is not a false 'unknown constructor'", async () => {
  const entrySrc =
    'import { A, B } from "./ast.al"\nlet f = e => switch e { | A(n) => n | B => 0 }';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, read({ [DEP]: DEP_SRC }));
  expect(diags).toEqual([]);

  // Guard rail: single-file checking still (wrongly) flags it — that's the very
  // false positive the module-aware path exists to remove.
  const single = diagnostics(entrySrc);
  expect(single).toHaveLength(1);
  expect(single[0]!.message).toContain("unknown constructor 'A'");
});

test("cross-module exhaustiveness is real: a missing imported ctor is flagged", async () => {
  const entrySrc = 'import { A, B } from "./ast.al"\nlet f = e => switch e { | A(n) => n }';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, read({ [DEP]: DEP_SRC }));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toContain("non-exhaustive");
  expect(diags[0]!.message).toContain("B");
});

test("the entry's own type error is still reported (with imports resolved)", async () => {
  const entrySrc = 'import { A } from "./ast.al"\nlet bad = add(1, { x: 2 })';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, read({ [DEP]: DEP_SRC }));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("type:");
});

test("the entry's own parse error is reported without touching deps", async () => {
  const entrySrc = 'import { A } from "./ast.al"\nlet x = ';
  const diags = await moduleDiagnostics(ENTRY, entrySrc, read({})); // dep never read
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("parse:");
});

test("a broken/missing dep degrades to single-file diagnostics, not a dep error", async () => {
  // Dep can't be read; the entry itself is clean single-file (no ctor match).
  const entrySrc = "let n = add(1, 2)";
  const diags = await moduleDiagnostics(ENTRY, entrySrc, read({}));
  expect(diags).toEqual([]);
});

test("a file with no imports behaves like single-file diagnostics", async () => {
  const diags = await moduleDiagnostics(ENTRY, "let bad = add(1, { x: 2 })", read({}));
  expect(diags).toHaveLength(1);
  expect(diags[0]!.message).toStartWith("type:");
});
