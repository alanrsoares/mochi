import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostTypesDts } from "../scripts/lib/host-types";

const fixture = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-host-types-"));
  for (const [name, src] of Object.entries(files)) writeFileSync(join(dir, name), src);
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
