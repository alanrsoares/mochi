// The docs site bundles compiler and DX modules for the browser. Vite builds
// a Node-only import without complaint and the page throws at load, so walk the
// site's static import graph here and refuse Node built-ins it cannot shim.
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { repoRoot } from "@mochi/test-support";
import { mochiWorkspaceAliases } from "@mochi/vite-plugin/workspace-aliases";

// `node:path` is aliased to `path-browserify` in `apps/docs/vite.config.ts`.
const SHIMMED = new Set(["node:path", "path"]);
const root = repoRoot(import.meta.url);
const docsSrc = join(root, "apps/docs/src");
const aliases = mochiWorkspaceAliases(root);
const tsScan = new Bun.Transpiler({ loader: "ts" });
const tsxScan = new Bun.Transpiler({ loader: "tsx" });

const sourcesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.(tsx?|mochi)$/.test(f) && !/\.spec\.|\.d\.ts$/.test(f))
    .map((f) => join(dir, f));

const withExtension = (base: string): string | undefined =>
  [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find(
    (p) => existsSync(p) && /\.(tsx?|mjs|js)$/.test(p),
  );

const resolveSpec = (spec: string, from: string): string | undefined => {
  if (spec.startsWith(".")) return withExtension(resolve(dirname(from), spec));
  for (const { find, replacement } of aliases) {
    if (typeof find === "string" ? spec === find : find.test(spec)) {
      return withExtension(
        typeof find === "string" ? replacement : spec.replace(find, replacement),
      );
    }
  }
  return undefined;
};

// A `.mochi` module reaches TypeScript through `extern … = "<specifier>"`.
const importsOf = (file: string): string[] => {
  const src = readFileSync(file, "utf8");
  if (file.endsWith(".mochi")) return [...src.matchAll(/=\s*"([^"]+)"/g)].map((m) => m[1] ?? "");
  if (file.endsWith(".mjs") || file.endsWith(".js")) {
    return [...src.matchAll(/(?:import|export)[^"']*?from\s*["']([^"']+)["']/g)].map(
      (m) => m[1] ?? "",
    );
  }
  return (file.endsWith(".tsx") ? tsxScan : tsScan).scanImports(src).map((i) => i.path);
};

type NodeImport = { readonly file: string; readonly spec: string };

const nodeImportsReachable = (roots: readonly string[]): NodeImport[] => {
  const seen = new Set<string>();
  const found: NodeImport[] = [];
  const stack = [...roots];
  while (stack.length > 0) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of importsOf(file)) {
      if (spec.startsWith("node:") || spec === "fs" || spec === "module" || spec === "url") {
        if (!SHIMMED.has(spec)) found.push({ file: relative(root, file), spec });
        continue;
      }
      const next = resolveSpec(spec, file);
      if (next !== undefined) stack.push(next);
    }
  }
  return found;
};

describe("docs site browser graph", () => {
  test("reaches no Node built-in the browser build cannot shim", () => {
    expect(nodeImportsReachable(sourcesUnder(docsSrc))).toEqual([]);
  });
});
