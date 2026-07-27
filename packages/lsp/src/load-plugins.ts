import { accessSync, constants, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { LanguagePlugin } from "@mochi/compiler/extensions";

/** Filenames searched upward from each `.mochi` file (Node-loadable; not `.ts`). */
export const PLUGIN_FILENAMES = ["mochi.plugins.mjs", "mochi.plugins.mts"] as const;

export type PluginLoadOptions = {
  /** Absolute workspace folder roots — manifests outside these paths are ignored. */
  allowedRoots?: readonly string[];
};

const cache = new Map<string, Promise<LanguagePlugin[] | undefined>>();

const exists = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const rootPrefix = (root: string): string => {
  const resolved = realpathSync(resolve(root));
  return resolved.endsWith(sep) ? resolved : `${resolved}${sep}`;
};

/** True when `file` resolves under one of `roots` (symlink-safe). */
export const isPathUnderRoots = (file: string, roots: readonly string[]): boolean => {
  if (!roots.length) return false;
  const resolved = realpathSync(resolve(file));
  return roots.some((root) => resolved.startsWith(rootPrefix(root)));
};

/** Walk parents from `startDir` until root (or `stopAt`) for a plugin manifest. */
export const findPluginsFile = (startDir: string, stopAt?: string): string | null => {
  let dir = startDir;
  for (;;) {
    for (const name of PLUGIN_FILENAMES) {
      const candidate = join(dir, name);
      if (exists(candidate)) return candidate;
    }
    if (stopAt && dir === stopAt) break;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
};

const assertPluginList = (plugins: unknown, file: string): LanguagePlugin[] => {
  if (!Array.isArray(plugins)) {
    throw new Error(`${file} must export default or named \`plugins\` array`);
  }
  for (const plugin of plugins) {
    if (typeof plugin !== "object" || plugin === null) {
      throw new Error(`${file}: plugin entries must be objects`);
    }
    if (typeof (plugin as LanguagePlugin).name !== "string") {
      throw new Error(`${file}: each plugin needs a string \`name\``);
    }
  }
  return plugins as LanguagePlugin[];
};

/** Dynamic-import a plugin manifest (`export default` or named `plugins`). */
export const loadPluginsFile = async (file: string): Promise<LanguagePlugin[]> => {
  const mod = (await import(pathToFileURL(file).href)) as {
    default?: unknown;
    plugins?: unknown;
  };
  return assertPluginList(mod.default ?? mod.plugins, file);
};

/** Cached vendor-plugin list for a `.mochi` path; `undefined` → builtin defaults. */
export const pluginsForDocument = async (
  filePath: string,
  opts: PluginLoadOptions = {},
): Promise<LanguagePlugin[] | undefined> => {
  const pluginsFile = findPluginsFile(dirname(filePath));
  if (!pluginsFile) return undefined;
  if (opts.allowedRoots?.length && !isPathUnderRoots(pluginsFile, opts.allowedRoots)) {
    return undefined;
  }
  let pending = cache.get(pluginsFile);
  if (!pending) {
    pending = loadPluginsFile(pluginsFile).catch(() => undefined);
    cache.set(pluginsFile, pending);
  }
  return pending;
};

/** Drop cached manifests (e.g. after the user edits `mochi.plugins.mjs`). */
export const clearPluginsCache = (): void => {
  cache.clear();
};
