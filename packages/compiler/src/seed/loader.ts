import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Node's CJS wrapper defines this. The editor bundle is CJS, and esbuild
 * rewrites `import.meta` to `{}` there, so `import.meta.url` is undefined.
 * Native ESM (Bun, the package itself) never evaluates this binding.
 */
declare const __filename: string;

const moduleDir = (): string => {
  const url = import.meta.url;
  if (typeof url === "string" && url.length > 0) return dirname(fileURLToPath(url));
  return dirname(__filename);
};

/** Absolute path of `bootstrap/seed/<name>`, from source or the editor bundle. */
export const seedPath = (name: string): string => {
  let dir = moduleDir();
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "bootstrap", "seed", name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`mochi bootstrap seed not found (${name}) from ${moduleDir()}`);
};

/** Load a CommonJS seed bundle. `createRequire` needs a real filename. */
export const loadSeed = <T>(name: string): T => {
  const path = seedPath(name);
  return createRequire(path)(path) as T;
};
