/**
 * Node-only: the symbol index with imports resolved across the entry's
 * dependency graph, loaded through the frozen bootstrap graph (ADR 0118).
 */
import { resolve } from "node:path";
import { type BootstrapExportOrigins, loadBootstrapGraph } from "@mochi/compiler/bootstrap";
import {
  emptyOrigins,
  type FileIndex,
  indexStmts,
  mergeOrigins,
  parseStmts,
} from "./bootstrap-index";

type ReadFile = (path: string) => Promise<string>;

/**
 * Export origins of every module in `entry`'s dependency graph but the entry
 * itself, the entry served from `src`. A graph that fails to load (an
 * unreadable dependency, a cycle, a parse error) resolves no imports.
 */
export const originsForEntry = async (
  entry: string,
  src: string,
  readFile: ReadFile,
): Promise<BootstrapExportOrigins> => {
  const graph = await loadBootstrapGraph(entry, src, readFile);
  const origins = emptyOrigins();
  if (graph._tag === "Err") return origins;
  const entryPath = resolve(entry);
  for (const module of graph.value)
    if (module.path !== entryPath) mergeOrigins(origins, module.origins);
  return origins;
};

/** Index `src` at `path` with its imports resolved across its dependency graph. */
export const indexModule = async (
  path: string,
  src: string,
  readFile: ReadFile,
): Promise<FileIndex | null> => {
  const stmts = parseStmts(src);
  return stmts ? indexStmts(path, stmts, await originsForEntry(path, src, readFile)) : null;
};
