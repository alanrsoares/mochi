import { expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  expect(run.exitCode).toBe(0);
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
    expect(run.exitCode).toBe(0);
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
});

test("a later Bun.build recompiles an edited .mochi source", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-bun-rebuild-"));
  const src = join(dir, "value.mochi");
  const build = async (): Promise<string> => {
    const built = await Bun.build({ entrypoints: [src], target: "bun", plugins: [mochiPlugin] });
    expect(built.success).toBe(true);
    return built.outputs[0]?.text() ?? "";
  };
  try {
    writeFileSync(src, "export let value = 1\n");
    expect(await build()).toContain("value = 1");
    writeFileSync(src, "export let value = 2\n");
    expect(await build()).toContain("value = 2");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

type GraphPaths = { dep: string; user: string; cache: string };

/** Run `body` with `vars` set (undefined unsets), restoring the previous values. */
const withEnv = async (
  vars: Readonly<Record<string, string | undefined>>,
  body: () => Promise<void>,
): Promise<void> => {
  const previous = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  const apply = (next: Readonly<Record<string, string | undefined>>): void => {
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  apply(vars);
  try {
    await body();
  } finally {
    apply(previous);
  }
};

/**
 * A two-module graph plus a private cache dir, removed afterwards. Clears
 * `MOCHI_BUN_CACHE` so a developer's `=0` cannot turn these into no-cache runs.
 */
const withCachedGraph = async (run: (paths: GraphPaths) => Promise<void>): Promise<void> => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-bun-cache-"));
  const paths: GraphPaths = {
    dep: join(dir, "dep.mochi"),
    user: join(dir, "user.mochi"),
    cache: join(dir, "cache"),
  };
  try {
    writeFileSync(paths.dep, "export let answer = 42\n");
    writeFileSync(
      paths.user,
      'import { answer } from "./dep.mochi"\n\nexport let doubled = answer * 2\n',
    );
    await withEnv({ MOCHI_BUN_CACHE: undefined, MOCHI_BUN_CACHE_DIR: paths.cache }, () =>
      run(paths),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** Swap one module's cached output for `marker`, so a cache hit is observable. */
const markCachedOutput = (cache: string, path: string, marker: string): void => {
  const [file] = readdirSync(cache).filter((f) => f.endsWith(".json"));
  const entry = JSON.parse(readFileSync(join(cache, file!), "utf8"));
  entry.outputs[path] = marker;
  writeFileSync(join(cache, file!), JSON.stringify(entry));
};

test("a cached graph is reused until any module in it changes", async () => {
  await withCachedGraph(async ({ dep, user, cache }) => {
    expect(await compileMochiFile(user)).toContain("export const doubled");
    markCachedOutput(cache, user, "// from cache");
    expect(await compileMochiFile(user)).toBe("// from cache");
    // An edit to an imported module, not just the entry, misses.
    writeFileSync(dep, "export let answer = 21\n");
    expect(await compileMochiFile(user)).toContain("export const doubled");
  });
});

test("a corrupt cache entry is a miss, not an error", async () => {
  await withCachedGraph(async ({ user, cache }) => {
    await compileMochiFile(user);
    const [file] = readdirSync(cache);
    writeFileSync(join(cache, file!), "{ not json");
    expect(await compileMochiFile(user)).toContain("export const doubled");
  });
});

test("a cache entry with null fields is a miss, not an error", async () => {
  await withCachedGraph(async ({ user, cache }) => {
    await compileMochiFile(user);
    const [file] = readdirSync(cache);
    writeFileSync(join(cache, file!), JSON.stringify({ sources: null, outputs: null }));
    expect(await compileMochiFile(user)).toContain("export const doubled");
  });
});

test("an unwritable cache dir still returns the compiled output", async () => {
  await withCachedGraph(async ({ user, cache }) => {
    // A regular file where the cache dir should be: every mkdir under it fails.
    writeFileSync(cache, "");
    await withEnv({ MOCHI_BUN_CACHE_DIR: join(cache, "nested") }, async () => {
      expect(await compileMochiFile(user)).toContain("export const doubled");
    });
  });
});
