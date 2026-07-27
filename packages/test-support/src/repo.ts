import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Walk up from `fromUrl` to the monorepo root (`mochi` workspace). */
export const repoRoot = (fromUrl: string): string => {
  let dir = dirname(fileURLToPath(fromUrl));
  for (;;) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        name?: string;
        workspaces?: unknown;
      };
      if (pkg.name === "mochi" && pkg.workspaces) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("mochi repo root not found");
};

export const readRepo = (fromUrl: string, rel: string): string =>
  readFileSync(join(repoRoot(fromUrl), rel), "utf8");

export const repoPath = (fromUrl: string, rel: string): string => join(repoRoot(fromUrl), rel);
