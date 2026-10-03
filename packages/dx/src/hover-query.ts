/**
 * Module-aware hover over the bootstrap graph. Node-only: the graph loader
 * reads the frozen module seed, so the browser build uses `hoverAt` alone.
 */
import { resolve } from "node:path";
import type { CompilerPlugin } from "@mochi/compiler/extensions";
import { type CompilerGraphCache, inferEntryGraphTypes } from "@mochi/compiler/graph";
import { qualifierMap } from "@mochi/compiler/types";
import {
  type HoverInfo,
  hoverAt,
  hoverFrom,
  hoverStmts,
  importHoverAt,
  lexTokens,
  syntaxHoverAt,
  tokenHoverAt,
} from "./hover";

type ReadFile = (path: string) => Promise<string>;

/**
 * The project's self-hosted-core `plugins` (styled-cva, …), the same list Vite
 * and `gen-mochi-dts` use, and a caller-owned graph memo valid for that one
 * list. Omitted plugins means the builtins (ADR 0011, 0109).
 */
export type ModuleHoverOptions = {
  plugins?: readonly CompilerPlugin[];
  cache?: CompilerGraphCache;
};

/**
 * Module-aware hover: type `path`'s dependency graph (deps from disk via
 * `readFile`, the edited file from the live `src` buffer), so a file that
 * imports a variant still types and hovers. Named imports hover with the
 * scheme they bind, and a type an `import * as D` brings into scope is
 * written `D.T`. Degrades to single-file `hoverAt` when the graph does not
 * type. `opts.plugins` reaches the whole graph, so `tw.*` factories hover
 * with a real component type.
 */
export const moduleHoverAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  opts: ModuleHoverOptions = {},
): Promise<HoverInfo | null> => {
  const tokens = lexTokens(src);
  const stmts = tokens && hoverStmts(src, opts.plugins);
  if (!tokens || !stmts) return null;
  const syntax = syntaxHoverAt(stmts, offset);
  if (syntax) return syntax;

  const inferred = await inferEntryGraphTypes(path, src, readFile, opts.cache, opts.plugins);
  const entryPath = resolve(path);
  const entry =
    inferred._tag === "Ok" ? inferred.value.find((module) => module.path === entryPath) : undefined;
  if (!entry) return hoverAt(src, offset, entryPath, opts.plugins);
  const imported = importHoverAt(stmts, offset, entry.imports);
  if (imported) return imported;

  const localTypes = new Set(stmts.flatMap((s) => (s._tag === "SType" ? [s.name] : [])));
  const qualify = qualifierMap(entry.quals, localTypes);
  return (
    hoverFrom(entry.types, entry.aliases, offset, src, entryPath, qualify) ??
    tokenHoverAt(tokens, offset)
  );
};
