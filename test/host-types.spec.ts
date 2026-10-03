import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { hostTypesDts } from "../scripts/lib/host-types";

const fixture = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-host-types-"));
  for (const [name, src] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), src);
  }
  return dir;
};

test.each([false, true])("seed driver saturation %s preserves the emitted result", (saturated) => {
  const dir = fixture({
    "compile.ts":
      "export type Err = { message: string };\nexport const compile: _Curry<[src: string, open: boolean], Result<string, Err>> = impl;\n",
  });
  const dts = hostTypesDts(
    dir,
    [],
    [{ name: "Seed", saturated, values: [{ file: "compile.ts", names: ["compile"] }] }],
  );
  expect(dts).toContain(
    `compile: ${saturated ? "HostFn" : "_Curry"}<[src: string, open: boolean], Result<string, Err>>`,
  );
});

test("identical aliases across seed modules share a declaration", () => {
  const decl = "export type Err = { message: string };\n";
  const dir = fixture({ "a.ts": decl, "b.ts": decl });
  expect(
    hostTypesDts(dir, [
      { file: "a.ts", names: ["Err"] },
      { file: "b.ts", names: ["Err"] },
    ]).match(/export type Err/g),
  ).toHaveLength(1);
});

test("conflicting aliases across seed modules still fail generation", () => {
  const dir = fixture({
    "a.ts": "export type Err = { message: string };\n",
    "b.ts": "export type Err = { code: number };\n",
  });
  expect(() =>
    hostTypesDts(dir, [
      { file: "a.ts", names: ["Err"] },
      { file: "b.ts", names: ["Err"] },
    ]),
  ).toThrow("declared differently");
});

test("seed host contracts follow sibling and parent-relative type imports", () => {
  const dir = fixture({
    "infer/types.ts": "export type Ty = { name: string };\n",
    "ast/ast.ts": 'import type { Ty } from "../infer/types";\nexport type Expr = { ty: Ty };\n',
    "compile/result.ts":
      'import type { Expr } from "../ast/ast";\nexport type Output = { expr: Expr };\n',
    "compile/compile.ts":
      'import type { Output } from "./result";\nexport const compile: _Curry<[src: string], Result<Output, string>> = impl;\n',
  });
  const dts = hostTypesDts(
    dir,
    [],
    [
      {
        name: "SeedCompile",
        saturated: true,
        values: [{ file: "compile/compile.ts", names: ["compile"] }],
      },
    ],
  );
  expect(dts).toContain("export type Ty = { name: string }");
  expect(dts).toContain("export type Expr = { ty: Ty }");
  expect(dts).toContain("export type Output = { expr: Expr }");
  expect(dts).toContain("compile: HostFn<[src: string], Result<Output, string>>");
});
