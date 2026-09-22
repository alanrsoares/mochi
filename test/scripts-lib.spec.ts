import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BOOTSTRAP_CLI,
  BOOTSTRAP_DIR,
  BOOTSTRAP_SEED,
  createTerminalStyles,
  duration,
  fileSha256,
  findWorkspacePackages,
  fit,
  meter,
  parseTscOutput,
  REPO_ROOT,
  readSeedManifest,
  repoPath,
  sha256,
  syncGeneratedFile,
  vendorPluginsFor,
  walkFiles,
} from "../scripts/lib";

test("repo paths and hashes", () => {
  expect(existsSync(REPO_ROOT)).toBe(true);
  expect(existsSync(BOOTSTRAP_DIR)).toBe(true);
  expect(existsSync(BOOTSTRAP_CLI)).toBe(true);
  expect(existsSync(BOOTSTRAP_SEED)).toBe(true);
  expect(repoPath("package.json")).toBe(join(REPO_ROOT, "package.json"));

  expect(sha256("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  expect(fileSha256(repoPath("package.json"))).toBe(sha256(readFileSync(repoPath("package.json"))));
});

test("vendorPluginsFor routes trees correctly", () => {
  expect(vendorPluginsFor("apps/docs/src/Button.mochi")).toBeDefined();
  expect(vendorPluginsFor("examples/snake/src/main.mochi")).toBeDefined();
  expect(vendorPluginsFor("bootstrap/ast.mochi")).toBeUndefined();
  expect(vendorPluginsFor("packages/compiler/src/index.ts")).toBeUndefined();
});

test("parseTscOutput parses error codes and files", () => {
  const sample = [
    "src/parser/parser.ts(12,3): error TS2322: Type 'string' is not assignable to type 'number'.",
    "src/infer/infer.ts(45,6): error TS2322: Type 'null' is not assignable to type 'undefined'.",
    "src/infer/infer.ts(80,1): error TS7006: Parameter 'x' implicitly has an 'any' type.",
  ].join("\n");

  const report = parseTscOutput(sample);
  expect(report.total).toBe(3);
  expect(report.byCode).toEqual({ TS2322: 2, TS7006: 1 });
  expect(report.byFile).toEqual({ "parser.ts": 1, "infer.ts": 2 });
  expect(report.errors).toHaveLength(3);
});

test("syncGeneratedFile writes or detects drift", () => {
  const tmp = mkdtempSync(join(tmpdir(), "mochi-gen-test-"));
  const target = join(tmp, "generated.txt");
  try {
    syncGeneratedFile(target, "hello world\n", { check: false });
    expect(readFileSync(target, "utf8")).toBe("hello world\n");
    expect(() => {
      syncGeneratedFile(target, "hello world\n", { check: true });
    }).not.toThrow();
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("findWorkspacePackages discovers monorepo packages", async () => {
  const pkgs = await findWorkspacePackages(REPO_ROOT);
  expect(pkgs.length).toBeGreaterThan(0);
  const names = pkgs.map((p) => p.name);
  expect(names).toContain("@mochi/compiler");
  expect(names).toContain("@mochi/cli");
});

test("seed utilities load manifest and walk files", () => {
  const manifest = readSeedManifest(BOOTSTRAP_SEED);
  expect(typeof manifest.sourceRevision).toBe("string");
  expect(manifest.files).toBeDefined();

  const files = walkFiles(BOOTSTRAP_SEED);
  expect(files).toContain("manifest.json");
  expect(files.some((f) => f.endsWith(".ts") || f.endsWith(".mjs"))).toBe(true);
});

test("terminal helpers format durations, meters, and text clipping", () => {
  expect(duration(50)).toBe("50ms");
  expect(duration(1500)).toBe("1.50s");

  const bar = meter(0.5, 10, "[COLOR]", "[RESET]", "[GRAY]");
  expect(bar).toContain("[COLOR]");
  expect(bar).toContain("[RESET]");

  expect(fit("short", 20)).toBe("short");
  expect(fit("this is a very long string that should be clipped", 10)).toBe("this is …");

  const styles = createTerminalStyles(false);
  expect(styles.RESET).toBe("");
  expect(styles.PHASE_ICON.passed).toBe("✔");
});
