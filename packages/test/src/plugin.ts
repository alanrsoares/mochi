/**
 * Bun loader for `.mochi` files. Compiles through the module graph so imported
 * names keep their inferred schemes (single-file `compile` would treat them as
 * unbound in strict mode). Relative imports stay `.mochi` so Bun re-enters here.
 *
 * Pair with bunfig `[loader] ".mochi" = "js"` so `bun test` treats `*.spec.mochi`
 * as test files (scanner requires a JS-like extension). This plugin is what
 * actually compiles — the loader mapping is discovery-only.
 */

import { resolve } from "node:path";
import { type Diagnostic, formatError } from "@mochi/compiler/errors";
import { buildModules } from "@mochi/compiler/module";
import { isErr } from "@onrails/result";
import type { BunPlugin } from "bun";

type MochiJsByPath = Map<string, string>;

const outputCache: MochiJsByPath = new Map();

const readFile = (path: string): Promise<string> => Bun.file(path).text();

const formatCompileFailure = (path: string, diags: Diagnostic[]): string =>
  `Mochi compilation failed for ${path}:\n${diags.map((d) => formatError(d)).join("\n")}`;

/** Compile `entry` and every reachable `.mochi` module; cache all outputs. */
export const compileMochiGraph = async (entry: string): Promise<MochiJsByPath> => {
  const abs = resolve(entry);
  const result = await buildModules(abs, readFile, { moduleExt: ".mochi" });
  if (isErr(result)) throw new SyntaxError(formatCompileFailure(abs, result.error));
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
