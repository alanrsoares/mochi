/** Node-only bootstrap graph hover for builtin LSP workspaces. */
import { resolve } from "node:path";
import { type BootstrapGraphCache, inferEntryGraphTypesBootstrap } from "@mochi/compiler/bootstrap";
import { bootstrapHoverFrom, type HoverInfo } from "./hover";

type ReadFile = (path: string) => Promise<string>;

/** Hover from the bootstrap graph, including imported modules. */
export const moduleBootstrapHoverAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  cache?: BootstrapGraphCache,
): Promise<HoverInfo | null> => {
  const inferred = await inferEntryGraphTypesBootstrap(path, src, readFile, cache);
  if (inferred._tag === "Err") return null;
  const entry = inferred.value.find((module) => module.path === resolve(path));
  return entry ? bootstrapHoverFrom(entry.types, entry.aliases, offset, src, path) : null;
};
