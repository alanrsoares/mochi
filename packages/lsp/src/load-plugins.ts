import {
  accessSync,
  constants,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import { type LanguagePlugin, pluginClashes, resolvePlugins } from "@mochi/compiler/extensions";
import {
  type ComponentHost,
  capability,
  createComponentHost,
  provide,
  type RuntimeComponent,
  resource,
} from "@mochi/runtime-components";
import { isErr, ResultAsync } from "@onrails/result";

/**
 * Filenames searched upward from each `.mochi` file. Prefer the typed
 * source; `.mjs` remains a fallback for older workspaces. Vendor packages
 * already export `.ts`, so the editor Node must strip types either way
 * (Node 22+ / Bun).
 */
export const PLUGIN_FILENAMES = ["mochi.plugins.ts", "mochi.plugins.mjs"] as const;

export type PluginLoadOptions = {
  /** Absolute workspace folder roots — manifests outside these paths are ignored. */
  allowedRoots?: readonly string[];
  /**
   * Called at most once per manifest path per cache generation when
   * {@link loadPluginsFile} fails (bad syntax, invalid shape, throwing
   * module). The failed load is still cached, so later calls for the same
   * path fall back to builtins silently until {@link clearPluginsCache} runs.
   */
  onError?: (file: string, error: unknown) => void;
};

/**
 * What a manifest supplies. `plugins` (the `default` or named `plugins` export)
 * runs on the self-hosted core (ADR 0109). `dxPlugins` is the optional
 * TypeScript-core copy that hover, completion, navigation, and formatting still
 * read until #103 moves them; it goes away then.
 */
export type ProjectPlugins = {
  readonly plugins: readonly BootstrapPlugin[];
  readonly dxPlugins?: readonly LanguagePlugin[];
};

const cache = new Map<string, Promise<ProjectPlugins | undefined>>();

/** The LSP capability supplied by a project's active plugin manifest. */
const projectPluginsCapability = capability<ProjectPlugins>("mochi.lsp.project-plugins");

/**
 * Hosts outlive a cache generation. This is what lets a failed reload retain
 * the prior working plugin set while the error is surfaced to the editor.
 */
const manifestHosts = new Map<string, ComponentHost>();

/**
 * Bumped by {@link clearPluginsCache}. Both Node's and Bun's ESM loaders
 * cache `import()` results by resolved file path forever, so clearing the
 * Map alone is not enough — a re-import of the same manifest path after an
 * edit would still return the stale module (Node *does* bust on a `?query`
 * suffix, but Bun ignores query/fragment suffixes and resolves by path
 * alone). {@link loadPluginsFile} instead copies the manifest's current
 * content into a generation-suffixed shadow file next to the original and
 * imports that — a genuinely distinct resolved path per generation, so both
 * loaders see a cache miss.
 */
let generation = 0;

const exists = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

/** `realpathSync`d root, `undefined` when the root no longer exists. */
const rootPrefix = (root: string): string | undefined => {
  try {
    const resolved = realpathSync(resolve(root));
    return resolved.endsWith(sep) ? resolved : `${resolved}${sep}`;
  } catch {
    return undefined;
  }
};

/**
 * True when `file` resolves under one of `roots` (symlink-safe). Returns
 * `false` — never throws — when `file` (or a root) vanishes between an
 * earlier existence check and this call (TOCTOU race on save/delete).
 */
export const isPathUnderRoots = (file: string, roots: readonly string[]): boolean => {
  if (!roots.length) return false;
  let resolved: string;
  try {
    resolved = realpathSync(resolve(file));
  } catch {
    return false;
  }
  return roots.some((root) => {
    const prefix = rootPrefix(root);
    return prefix !== undefined && resolved.startsWith(prefix);
  });
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

/** Bootstrap hooks are plain functions; TypeScript-core `inferCall` is a `{ refs, hook }` record. */
const BOOTSTRAP_HOOKS = ["parse", "inferCall", "format", "dtsBinding"] as const;

const assertNamedList = (plugins: unknown, file: string, exportName: string): unknown[] => {
  if (!Array.isArray(plugins)) {
    throw new Error(`${file} must export ${exportName} array`);
  }
  const seenNames = new Set<string>();
  for (const plugin of plugins) {
    if (typeof plugin !== "object" || plugin === null) {
      throw new Error(`${file}: plugin entries must be objects`);
    }
    const name = (plugin as { name?: unknown }).name;
    if (typeof name !== "string") {
      throw new Error(`${file}: each plugin needs a string \`name\``);
    }
    if (seenNames.has(name)) {
      throw new Error(`${file}: duplicate plugin name "${name}"`);
    }
    seenNames.add(name);
  }
  return plugins;
};

const assertBootstrapPlugins = (plugins: unknown, file: string): BootstrapPlugin[] => {
  const list = assertNamedList(plugins, file, "default or named `plugins`");
  for (const plugin of list as Record<string, unknown>[]) {
    for (const hook of BOOTSTRAP_HOOKS) {
      if (plugin[hook] !== undefined && typeof plugin[hook] !== "function") {
        throw new Error(
          `${file}: plugin "${String(plugin.name)}" \`${hook}\` must be a function — \`plugins\` takes self-hosted-core plugins (ADR 0109); TypeScript-core ones go in \`dxPlugins\``,
        );
      }
    }
  }
  return list as BootstrapPlugin[];
};

/** A manifest module's exports, before validation. */
type ManifestModule = { default?: unknown; plugins?: unknown; dxPlugins?: unknown };

const assertProjectPlugins = (mod: ManifestModule, file: string): ProjectPlugins => {
  const plugins = assertBootstrapPlugins(mod.default ?? mod.plugins, file);
  if (mod.dxPlugins === undefined) return { plugins };
  const dxPlugins = assertNamedList(mod.dxPlugins, file, "`dxPlugins` as an") as LanguagePlugin[];
  return { plugins, dxPlugins };
};

/** Shadow-copy path for `file` at the current cache `generation` (same dir, so relative imports inside the manifest still resolve). */
const shadowPathFor = (file: string, gen: number): string => {
  const ext = extname(file);
  const stem = basename(file, ext);
  return join(dirname(file), `.${stem}.gen${gen}${ext}`);
};

/**
 * Dynamic-import a plugin manifest (`export default` or named `plugins`, plus
 * an optional `dxPlugins`).
 * Generation 0 (the common case — no reload has happened) imports `file`
 * directly, writing nothing to the workspace. After {@link clearPluginsCache}
 * the manifest path is already in the ESM loader's cache, so a reload imports
 * a generation-suffixed shadow copy instead — see {@link generation} — and
 * always removes it afterward, whether the import succeeds or throws.
 */
export const loadPluginsFile = async (file: string): Promise<ProjectPlugins> => {
  const gen = generation;
  const importManifest = async (path: string): Promise<ProjectPlugins> => {
    const mod = (await import(pathToFileURL(path).href)) as ManifestModule;
    return assertProjectPlugins(mod, file);
  };
  if (gen === 0) return importManifest(file);
  const shadow = shadowPathFor(file, gen);
  writeFileSync(shadow, readFileSync(file));
  try {
    return await importManifest(shadow);
  } finally {
    try {
      unlinkSync(shadow);
    } catch {
      // best-effort cleanup; a leftover shadow file is harmless (next
      // generation writes a differently-named one).
    }
  }
};

/** Claim clashes (ADR 0050) are declared by TypeScript-core `inferCall.refs`, so only `dxPlugins` can clash. */
const validatePlugins = (project: ProjectPlugins): ProjectPlugins => {
  const clashes = project.dxPlugins ? pluginClashes(resolvePlugins([...project.dxPlugins])) : [];
  if (clashes.length > 0) throw new Error(clashes.map((d) => d.message).join("; "));
  return project;
};

const projectPluginsComponent = (project: ProjectPlugins): RuntimeComponent => ({
  name: "mochi-lsp-project-plugins",
  provides: [projectPluginsCapability],
  activate: () => ResultAsync.ok(resource([provide(projectPluginsCapability, project)])),
});

const activePlugins = (host: ComponentHost): ProjectPlugins | undefined =>
  host.get(projectPluginsCapability);

const hasActivationCause = (
  error: unknown,
): error is { readonly kind: "activation-failed"; readonly cause: unknown } =>
  typeof error === "object" &&
  error !== null &&
  "kind" in error &&
  error.kind === "activation-failed" &&
  "cause" in error;

const reloadCause = (error: unknown): unknown => (hasActivationCause(error) ? error.cause : error);

/**
 * Innermost `roots` entry that lexically contains `file`, or `undefined`
 * (symlinked layouts may match none — the caller then walks unbounded and
 * relies on {@link isPathUnderRoots}' realpath check alone).
 */
const lexicalRootOf = (file: string, roots: readonly string[]): string | undefined => {
  const resolved = resolve(file);
  let best: string | undefined;
  for (const root of roots) {
    const r = resolve(root);
    const prefix = r.endsWith(sep) ? r : `${r}${sep}`;
    if (resolved.startsWith(prefix) && (best === undefined || r.length > best.length)) {
      best = r;
    }
  }
  return best;
};

/** Cached vendor plugins for a `.mochi` path; `undefined` → builtin defaults. */
export const pluginsForDocument = async (
  filePath: string,
  opts: PluginLoadOptions = {},
): Promise<ProjectPlugins | undefined> => {
  // Stop the upward walk at the workspace root when one contains the file —
  // a manifest above it would be rejected by `isPathUnderRoots` anyway.
  const stopAt = opts.allowedRoots?.length ? lexicalRootOf(filePath, opts.allowedRoots) : undefined;
  const pluginsFile = findPluginsFile(dirname(filePath), stopAt);
  if (!pluginsFile) return undefined;
  if (opts.allowedRoots?.length && !isPathUnderRoots(pluginsFile, opts.allowedRoots)) {
    return undefined;
  }
  let pending = cache.get(pluginsFile);
  if (!pending) {
    const existingHost = manifestHosts.get(pluginsFile);
    const host = existingHost ?? createComponentHost();
    pending = (async () => {
      const plugins = validatePlugins(await loadPluginsFile(pluginsFile));
      const component = projectPluginsComponent(plugins);
      const transition = await (existingHost
        ? host.replace(component.name, component)
        : host.mount(component));
      if (isErr(transition)) throw transition.error;
      manifestHosts.set(pluginsFile, host);
      return activePlugins(host);
    })().catch((error) => {
      opts.onError?.(pluginsFile, reloadCause(error));
      return existingHost ? activePlugins(existingHost) : undefined;
    });
    cache.set(pluginsFile, pending);
  }
  return pending;
};

/** Drop cached manifests (e.g. after the user edits `mochi.plugins.ts`). */
export const clearPluginsCache = (): void => {
  cache.clear();
  generation += 1;
};
