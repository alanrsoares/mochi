// One typed-graph emit shared by `seed:check` and `bootstrap:self-tsc`.
// Those tasks pass different runtime import strings, but the import is only
// spliced into `from "..."` specifiers, so the compile runs once against a
// sentinel and each caller rewrites its own specifier. Cross-process: a claim
// file, same shape as the JS graph cache in `@mochi/test-support/bootstrap`.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type {
  BootstrapDiagnostic,
  BootstrapModuleOutput,
  BootstrapResult,
} from "@mochi/compiler/bootstrap";
import { buildModulesTsBootstrap } from "@mochi/compiler/bootstrap/module";
import { bootstrapCacheHash } from "@mochi/test-support/bootstrap";
import { BOOTSTRAP_CLI, REPO_ROOT, repoPath } from "./repo";

export const RUNTIME_SENTINEL = "__MOCHI_RUNTIME_IMPORT__";

const CACHE_ROOT = repoPath(".cache", "bootstrap-ts-emit");
const CLAIM_STALE_MS = 12 * 60 * 1000;
const WAIT_MS = 12 * 60 * 1000;

export type TsEmitBuild = (
  runtimeImport: string,
) => BootstrapResult<readonly BootstrapModuleOutput[], readonly BootstrapDiagnostic[]>;

export type TsEmitCache = {
  readonly root: string;
  readonly key: string;
  readonly build: TsEmitBuild;
};

type StoredOutput = { readonly path: string };

const ready = (dir: string): boolean => existsSync(join(dir, "outputs.json"));

const parseStored = (raw: string): readonly StoredOutput[] | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const files: StoredOutput[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null || !("path" in item)) return null;
    const path = item.path;
    if (typeof path !== "string") return null;
    files.push({ path });
  }
  return files;
};

const readEmit = (dir: string, runtimeImport: string): readonly BootstrapModuleOutput[] | null => {
  try {
    const stored = parseStored(readFileSync(join(dir, "outputs.json"), "utf8"));
    if (stored === null) return null;
    const from = `"${RUNTIME_SENTINEL}"`;
    const to = `"${runtimeImport}"`;
    return stored.map((file) => ({
      path: resolve(REPO_ROOT, file.path),
      js: readFileSync(join(dir, "files", file.path), "utf8").replaceAll(from, to),
    }));
  } catch {
    return null;
  }
};

const writeEmit = (dir: string, modules: readonly BootstrapModuleOutput[]): void => {
  const stored = modules.map((mod) => {
    const rel = relative(REPO_ROOT, mod.path);
    const dest = join(dir, "files", rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, mod.js);
    return { path: rel };
  });
  writeFileSync(join(dir, "outputs.json"), `${JSON.stringify(stored)}\n`);
};

const tryClaim = (claim: string): boolean => {
  try {
    writeFileSync(claim, String(process.pid), { flag: "wx" });
    return true;
  } catch {
    try {
      const age = Date.now() - statSync(claim).mtimeMs;
      if (age > CLAIM_STALE_MS) {
        rmSync(claim, { force: true });
        writeFileSync(claim, String(process.pid), { flag: "wx" });
        return true;
      }
    } catch {
      // Peer still holds a fresh claim, or we lost the stale-retry race.
    }
    return false;
  }
};

const releaseClaim = (claim: string): void => {
  try {
    rmSync(claim, { force: true });
  } catch {
    // Best-effort; a peer may have already cleared a stale claim.
  }
};

const waitUntilReady = (dir: string, claim: string): boolean => {
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    if (ready(dir)) return true;
    if (!existsSync(claim)) return ready(dir);
    Bun.sleepSync(200);
  }
  return ready(dir);
};

export const cachedTsEmit = (
  runtimeImport: string,
  cache: TsEmitCache,
): BootstrapResult<readonly BootstrapModuleOutput[], readonly BootstrapDiagnostic[]> => {
  const dest = join(cache.root, cache.key);
  if (ready(dest)) {
    const hit = readEmit(dest, runtimeImport);
    if (hit !== null) return { _tag: "Ok", value: hit };
  }

  mkdirSync(cache.root, { recursive: true });
  const claim = join(cache.root, `${cache.key}.building`);
  const builder = tryClaim(claim);

  if (!builder) {
    if (waitUntilReady(dest, claim)) {
      const hit = readEmit(dest, runtimeImport);
      if (hit !== null) return { _tag: "Ok", value: hit };
    }
  } else if (ready(dest)) {
    releaseClaim(claim);
    const hit = readEmit(dest, runtimeImport);
    if (hit !== null) return { _tag: "Ok", value: hit };
  }

  const tmp = join(cache.root, `${cache.key}.tmp-${process.pid}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    const built = cache.build(RUNTIME_SENTINEL);
    if (built._tag === "Err") {
      rmSync(tmp, { recursive: true, force: true });
      return built;
    }
    writeEmit(tmp, built.value);
    try {
      if (builder && existsSync(dest)) rmSync(dest, { recursive: true, force: true });
      renameSync(tmp, dest);
    } catch {
      rmSync(tmp, { recursive: true, force: true });
      const hit = ready(dest) ? readEmit(dest, runtimeImport) : null;
      if (hit === null) {
        return {
          _tag: "Err",
          error: [
            {
              message: `bootstrap ts emit cache race failed for ${cache.key}`,
              start: 0,
              end: 0,
            },
          ],
        };
      }
      return { _tag: "Ok", value: hit };
    }
  } finally {
    if (builder) releaseClaim(claim);
  }

  const hit = readEmit(dest, runtimeImport);
  if (hit === null) {
    return {
      _tag: "Err",
      error: [{ message: `bootstrap ts emit cache unreadable at ${cache.key}`, start: 0, end: 0 }],
    };
  }
  return { _tag: "Ok", value: hit };
};

export const loadCachedTsEmit = (
  runtimeImport: string,
): BootstrapResult<readonly BootstrapModuleOutput[], readonly BootstrapDiagnostic[]> =>
  cachedTsEmit(runtimeImport, {
    root: CACHE_ROOT,
    key: bootstrapCacheHash(),
    build: (runtime) => buildModulesTsBootstrap(BOOTSTRAP_CLI, runtime),
  });
