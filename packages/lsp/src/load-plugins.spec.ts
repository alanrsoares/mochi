import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  clearPluginsCache,
  findPluginsFile,
  isPathUnderRoots,
  loadPluginsFile,
  pluginsForDocument,
} from "./load-plugins.ts";

test("findPluginsFile walks up to a nested mochi.plugins.mjs", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    writeFileSync(join(root, "mochi.plugins.mjs"), "export default [];\n");
    const nested = join(root, "src", "components");
    expect(findPluginsFile(nested)).toBe(join(root, "mochi.plugins.mjs"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loadPluginsFile reads default export", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(file, 'export default [{ name: "test" }];\n');
    clearPluginsCache();
    const plugins = await loadPluginsFile(file);
    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.name).toBe("test");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("isPathUnderRoots rejects manifests outside workspace roots", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  const outside = mkdtempSync(join(import.meta.dir, ".plugins-out-"));
  try {
    const manifest = join(root, "mochi.plugins.mjs");
    writeFileSync(manifest, "export default [];\n");
    expect(isPathUnderRoots(manifest, [root])).toBe(true);
    expect(isPathUnderRoots(manifest, [outside])).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("pluginsForDocument ignores symlinked manifests outside allowed roots", async () => {
  const ws = mkdtempSync(join(import.meta.dir, ".plugins-ws-"));
  const outside = mkdtempSync(join(import.meta.dir, ".plugins-out-"));
  try {
    const evil = join(outside, "mochi.plugins.mjs");
    writeFileSync(evil, 'export default [{ name: "evil" }];\n');
    symlinkSync(evil, join(ws, "mochi.plugins.mjs"));
    clearPluginsCache();
    const nested = join(ws, "src", "app.mochi");
    const plugins = await pluginsForDocument(nested, { allowedRoots: [ws] });
    expect(plugins).toBeUndefined();
  } finally {
    rmSync(ws, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
