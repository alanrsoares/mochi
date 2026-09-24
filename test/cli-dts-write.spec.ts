// `mochi dts --write <dir>` writes an `allowArbitraryExtensions` sidecar beside
// every module, graph-aware, so host TypeScript type-checks `.mochi` imports (ADR 0108).
import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoPath } from "@mochi/test-support";

const CLI = repoPath(import.meta.url, "packages/cli/src/cli.ts");

const mochi = (...args: readonly string[]) =>
  Bun.spawnSync([process.execPath, CLI, ...args], { stderr: "pipe", stdout: "pipe" });

test("dts --write covers a directory graph with .mochi type imports", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-dts-write-"));
  try {
    writeFileSync(join(dir, "shapes.mochi"), "export type Shape =\n  | Circle(r: number)\n");
    writeFileSync(
      join(dir, "geo.mochi"),
      'import * as S from "./shapes.mochi"\n\nexport let unit = S.Circle(1)\n',
    );
    writeFileSync(join(dir, "geo.spec.mochi"), "");
    const run = mochi("dts", "--write", dir);
    expect(run.exitCode).toBe(0);
    const geo = readFileSync(join(dir, "geo.d.mochi.ts"), "utf8");
    expect(geo).toContain('import type * as S from "./shapes.mochi";');
    expect(geo).toContain("export declare const unit: S.Shape;");
    expect(existsSync(join(dir, "shapes.d.mochi.ts"))).toBe(true);
    expect(existsSync(join(dir, "geo.spec.d.mochi.ts"))).toBe(false);
    // Without --write, stdout carries the same declarations.
    expect(mochi("dts", join(dir, "geo.mochi")).stdout.toString()).toBe(geo);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30_000);
