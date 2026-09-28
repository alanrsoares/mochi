/**
 * Bun loader for `.mochi` files. Compiles through the module graph so imported
 * names keep their inferred schemes (single-file `compile` would treat them as
 * unbound in strict mode). Relative imports stay `.mochi` so Bun re-enters here.
 *
 * Any Bun process that imports `.mochi` registers it via `@mochi/bun/preload`
 * (ADR 0108). Pair with bunfig `[loader] ".mochi" = "js"` so `bun test` treats `*.spec.mochi`
 * as test files (scanner requires a JS-like extension). This plugin is what
 * actually compiles — the loader mapping is discovery-only.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { bootstrapSeedId, buildModulesBootstrapWith } from "@mochi/compiler/bootstrap/module";
import { isErr } from "@onrails/result";
import type { BunPlugin } from "bun";

type MochiJsByPath = Map<string, string>;

/**
 * One entry's compiled graph on disk: the source hash of every module it read,
 * and every module's output. Any changed source or a refrozen seed misses.
 */
type GraphCacheEntry = {
  readonly sources: Record<string, string>;
  readonly outputs: Record<string, string>;
};

/** Bump when the entry shape or the compile options below change. */
const CACHE_VERSION = 1;

const sha256 = (text: string | Buffer): string => createHash("sha256").update(text).digest("hex");

/**
 * `bun test --parallel` isolates every file, so an in-memory cache never
 * outlives one spec and each would recompile the compiler graph it imports.
 * `MOCHI_BUN_CACHE=0` turns the disk cache off.
 */
const cacheDir = (): string | null =>
  process.env.MOCHI_BUN_CACHE === "0"
    ? null
    : (process.env.MOCHI_BUN_CACHE_DIR ??
      join(process.cwd(), "node_modules", ".cache", "mochi-bun"));

let seedId: string | undefined;
const cacheFile = (dir: string, abs: string): string => {
  seedId ??= bootstrapSeedId();
  return join(dir, `${sha256(`${CACHE_VERSION}\0${seedId}\0${abs}`)}.json`);
};

const readSource = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

/** A corrupt or foreign entry is a miss, not an error: the compile rewrites it. */
const parseEntry = (raw: string): GraphCacheEntry | null => {
  try {
    const entry = JSON.parse(raw) as Partial<GraphCacheEntry> | null;
    return typeof entry?.sources === "object" && typeof entry.outputs === "object"
      ? (entry as GraphCacheEntry)
      : null;
  } catch {
    return null;
  }
};

const readCached = (file: string): MochiJsByPath | null => {
  const raw = readSource(file);
  const entry = raw === null ? null : parseEntry(raw);
  if (entry === null) return null;
  for (const [path, hash] of Object.entries(entry.sources)) {
    const src = readSource(path);
    if (src === null || sha256(src) !== hash) return null;
  }
  return new Map(Object.entries(entry.outputs));
};

/** Write then rename, so a parallel reader never sees a half-written entry. */
const writeCached = (dir: string, file: string, graph: MochiJsByPath): void => {
  const sources: Record<string, string> = {};
  for (const path of graph.keys()) {
    const src = readSource(path);
    if (src === null) return;
    sources[path] = sha256(src);
  }
  const entry: GraphCacheEntry = { sources, outputs: Object.fromEntries(graph) };
  mkdirSync(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry));
  renameSync(tmp, file);
};

/** Compile `entry` and every reachable `.mochi` module, reusing a disk entry when current. */
export const compileMochiGraph = async (entry: string): Promise<MochiJsByPath> => {
  const abs = resolve(entry);
  const dir = cacheDir();
  const file = dir === null ? null : cacheFile(dir, abs);
  const cached = file === null ? null : readCached(file);
  if (cached !== null) return cached;
  const graph = compileGraph(abs);
  if (dir !== null && file !== null) writeCached(dir, file, graph);
  return graph;
};

const compileGraph = (abs: string): MochiJsByPath => {
  const result = buildModulesBootstrapWith(abs, {
    open: false,
    runtime: true,
    docs: true,
    // Relative imports stay `.mochi` so Bun re-enters this loader for siblings.
    moduleExt: ".mochi",
    strictEntry: false,
  });
  if (isErr(result))
    throw new SyntaxError(formatCompileFailure(abs, result.error.map((e) => e.message).join("\n")));
  const graph: MochiJsByPath = new Map();
  for (const out of result.value) graph.set(out.path, out.js);
  return graph;
};

export const compileMochiFile = async (entry: string): Promise<string> => {
  const abs = resolve(entry);
  const graph = await compileMochiGraph(abs);
  const js = graph.get(abs);
  if (js === undefined) throw new SyntaxError(`Mochi graph omitted '${abs}'`);
  return js;
};

export const mochiPlugin: BunPlugin = {
  name: "mochi",
  setup(build) {
    // Per-build: one graph compile serves every sibling load in this build, and a
    // later `Bun.build` recompiles instead of reusing stale output.
    const outputCache: MochiJsByPath = new Map();
    build.onLoad({ filter: /\.mochi$/ }, async (args) => {
      const path = resolve(args.path);
      const cached = outputCache.get(path);
      if (cached !== undefined) return { contents: cached, loader: "js" as const };
      const graph = await compileMochiGraph(path);
      for (const [p, js] of graph) outputCache.set(p, js);
      const contents = outputCache.get(path);
      if (contents === undefined) throw new SyntaxError(`Mochi graph omitted '${path}'`);
      return { contents, loader: "js" as const };
    });
  },
};
const formatCompileFailure = (path: string, message: string): string =>
  `Mochi compilation failed for ${path}:\n${message}`;
