import { createHash } from "node:crypto";

/** A dependency-ordered graph module with its resolved direct imports. */
export type SliceNode = { path: string; src: string; deps: readonly string[] };

/**
 * Per-module cache keys (ADR 0111). A key covers the module's path and source,
 * `salt` (what else its result depends on), and its imports' keys, so an edit
 * anywhere below a module changes its key and nothing else needs invalidating.
 * `graph` is dependency-ordered, so every import is keyed before its importer.
 */
export const moduleKeys = (
  graph: readonly SliceNode[],
  salt: (node: SliceNode) => string,
): Map<string, string> => {
  const keys = new Map<string, string>();
  for (const node of graph) {
    const depKeys = node.deps.map((dep) => keys.get(dep) ?? dep).toSorted();
    const key = createHash("sha256")
      .update(JSON.stringify([node.path, node.src, salt(node), depKeys]))
      .digest("hex");
    keys.set(node.path, key);
  }
  return keys;
};

/** Each module's transitive imports, in graph order. */
export const closures = (graph: readonly SliceNode[]): Map<string, readonly string[]> => {
  const below = new Map<string, Set<string>>();
  for (const node of graph) {
    const set = new Set<string>();
    for (const dep of node.deps) {
      set.add(dep);
      for (const inner of below.get(dep) ?? []) set.add(inner);
    }
    below.set(node.path, set);
  }
  const order = graph.map((node) => node.path);
  return new Map(order.map((path) => [path, order.filter((p) => below.get(path)?.has(p))]));
};
