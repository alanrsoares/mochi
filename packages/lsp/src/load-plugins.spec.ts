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

test("findPluginsFile prefers mochi.plugins.ts over .mjs", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    writeFileSync(join(root, "mochi.plugins.mjs"), "export default [];\n");
    writeFileSync(join(root, "mochi.plugins.ts"), "export default [];\n");
    const nested = join(root, "src", "components");
    expect(findPluginsFile(nested)).toBe(join(root, "mochi.plugins.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("findPluginsFile falls back to mochi.plugins.mjs", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    writeFileSync(join(root, "mochi.plugins.mjs"), "export default [];\n");
    const nested = join(root, "src", "components");
    expect(findPluginsFile(nested)).toBe(join(root, "mochi.plugins.mjs"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loadPluginsFile reads default export from .ts", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.ts");
    writeFileSync(file, 'export default [{ name: "test" }];\n');
    clearPluginsCache();
    const plugins = await loadPluginsFile(file);
    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.name).toBe("test");
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

test("pluginsForDocument reports a broken manifest via onError, once across two calls", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(file, "export default { not: 'an array' };\n");
    clearPluginsCache();
    const nested = join(root, "src", "app.mochi");
    const errors: Array<{ file: string; error: unknown }> = [];
    const onError = (errFile: string, error: unknown) => errors.push({ file: errFile, error });

    const first = await pluginsForDocument(nested, { onError });
    expect(first).toBeUndefined();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.file).toBe(file);

    const second = await pluginsForDocument(nested, { onError });
    expect(second).toBeUndefined();
    expect(errors).toHaveLength(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pluginsForDocument reports a syntax-broken manifest via onError", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(file, "export default [{ name: ");
    clearPluginsCache();
    const errors: Array<{ file: string; error: unknown }> = [];
    const plugins = await pluginsForDocument(join(root, "app.mochi"), {
      onError: (errFile, error) => errors.push({ file: errFile, error }),
    });
    expect(plugins).toBeUndefined();
    expect(errors).toHaveLength(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pluginsForDocument reports duplicate plugin names via onError", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(file, 'export default [{ name: "x" }, { name: "x" }];\n');
    clearPluginsCache();
    const errors: Array<{ file: string; error: unknown }> = [];
    const plugins = await pluginsForDocument(join(root, "app.mochi"), {
      onError: (errFile, error) => errors.push({ file: errFile, error }),
    });
    expect(plugins).toBeUndefined();
    expect(errors).toHaveLength(1);
    expect(String((errors[0]?.error as Error)?.message)).toContain("duplicate plugin name");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pluginsForDocument reports a claim clash via onError (ADR 0050)", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(
      file,
      [
        "export default [",
        '  { name: "a", inferCall: { refs: ["useThing"], hook: () => null } },',
        '  { name: "b", inferCall: { refs: ["useThing"], hook: () => null } },',
        "];",
        "",
      ].join("\n"),
    );
    clearPluginsCache();
    const errors: Array<{ file: string; error: unknown }> = [];
    const plugins = await pluginsForDocument(join(root, "app.mochi"), {
      onError: (errFile, error) => errors.push({ file: errFile, error }),
    });
    expect(plugins).toBeUndefined();
    expect(errors).toHaveLength(1);
    expect(String((errors[0]?.error as Error)?.message)).toContain("clash");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("isPathUnderRoots returns false, without throwing, for a nonexistent file", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const missing = join(root, "does-not-exist.mochi");
    expect(() => isPathUnderRoots(missing, [root])).not.toThrow();
    expect(isPathUnderRoots(missing, [root])).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("isPathUnderRoots returns false, without throwing, for a nonexistent root", () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    writeFileSync(file, "export default [];\n");
    const missingRoot = join(root, "ghost-root");
    expect(() => isPathUnderRoots(file, [missingRoot])).not.toThrow();
    expect(isPathUnderRoots(file, [missingRoot])).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
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

test("pluginsForDocument picks up an edited manifest after clearPluginsCache (ESM cache-bust)", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    const nested = join(root, "src", "app.mochi");

    writeFileSync(file, 'export default [{ name: "first" }];\n');
    clearPluginsCache();
    const before = await pluginsForDocument(nested);
    expect(before).toHaveLength(1);
    expect(before?.[0]?.name).toBe("first");

    writeFileSync(file, 'export default [{ name: "second" }, { name: "third" }];\n');
    clearPluginsCache();
    const after = await pluginsForDocument(nested);
    expect(after).toHaveLength(2);
    expect(after?.map((p) => p.name)).toEqual(["second", "third"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pluginsForDocument recovers once a broken manifest is fixed and the cache is cleared", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    const nested = join(root, "src", "app.mochi");
    const errors: Array<{ file: string; error: unknown }> = [];
    const onError = (errFile: string, error: unknown) => errors.push({ file: errFile, error });

    writeFileSync(file, "export default [{ name: ");
    clearPluginsCache();
    const broken = await pluginsForDocument(nested, { onError });
    expect(broken).toBeUndefined();
    expect(errors).toHaveLength(1);

    writeFileSync(file, 'export default [{ name: "fixed" }];\n');
    clearPluginsCache();
    const fixed = await pluginsForDocument(nested, { onError });
    expect(fixed).toHaveLength(1);
    expect(fixed?.[0]?.name).toBe("fixed");
    expect(errors).toHaveLength(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pluginsForDocument retains the active plugins when a reload fails", async () => {
  const root = mkdtempSync(join(import.meta.dir, ".plugins-"));
  try {
    const file = join(root, "mochi.plugins.mjs");
    const nested = join(root, "src", "app.mochi");
    const errors: Array<{ file: string; error: unknown }> = [];

    writeFileSync(file, 'export default [{ name: "working" }];\n');
    clearPluginsCache();
    const active = await pluginsForDocument(nested);
    expect(active?.map((plugin) => plugin.name)).toEqual(["working"]);

    writeFileSync(file, "export default [{ name: ");
    clearPluginsCache();
    const retained = await pluginsForDocument(nested, {
      onError: (errFile, error) => errors.push({ file: errFile, error }),
    });
    expect(retained?.map((plugin) => plugin.name)).toEqual(["working"]);
    expect(errors).toHaveLength(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
