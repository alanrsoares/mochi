import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileMochiFile, mochiPlugin } from "./plugin.ts";

const fixture = (name: string): string => new URL(`./fixtures/${name}`, import.meta.url).pathname;

test("graph compile keeps relative imports as .mochi", async () => {
  const js = await compileMochiFile(fixture("user.mochi"));
  expect(js).toContain('from "./dep.mochi"');
  expect(js).toContain("export const doubled");
  expect(js).not.toContain(".js");
});

test("graph compile threads imported schemes (strict)", async () => {
  const js = await compileMochiFile(fixture("user.mochi"));
  expect(js).toContain("const doubled");
});

test("graph compile fails on unbound names", async () => {
  await expect(compileMochiFile(fixture("unbound.mochi"))).rejects.toThrow(
    /unbound variable 'notAName'/,
  );
});

test("a plain bun process preloading @mochi/bun/preload runs JS that imports .mochi", () => {
  // Outside `bun test`: the path `bun run example:life` takes (ADR 0108).
  const run = Bun.spawnSync(
    [process.execPath, "--preload", "@mochi/bun/preload", fixture("entry.mjs")],
    {
      cwd: new URL("..", import.meta.url).pathname,
    },
  );
  expect(run.stderr.toString()).toBe("");
  expect(run.stdout.toString()).toBe("84\n");
});

test("Bun.build bundles .mochi imports through mochiPlugin", async () => {
  const outdir = mkdtempSync(join(tmpdir(), "mochi-bun-build-"));
  try {
    const built = await Bun.build({
      entrypoints: [fixture("entry.mjs")],
      outdir,
      target: "bun",
      plugins: [mochiPlugin],
    });
    expect(built.logs).toEqual([]);
    expect(built.success).toBe(true);
    // The bundle carries the compiled graph, so it runs with no preload.
    const run = Bun.spawnSync([process.execPath, join(outdir, "entry.js")]);
    expect(run.stdout.toString()).toBe("84\n");
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
});
