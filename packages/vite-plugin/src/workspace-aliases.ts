/** Vite aliases so Node/Vite resolve workspace packages into Bun-style TS sources (ADR 0048). */
import { readFileSync } from "node:fs";
import path from "node:path";

export type WorkspaceAlias = { find: string | RegExp; replacement: string };

const compilerAliases = (root: string): WorkspaceAlias[] => {
  const pkgPath = path.join(root, "packages/compiler/package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    exports: Record<string, string>;
  };
  const out: WorkspaceAlias[] = [];
  for (const [key, rel] of Object.entries(pkg.exports)) {
    const abs = path.join(root, "packages/compiler", rel.replace(/^\.\//, ""));
    if (key === ".") {
      out.push({ find: "@mochi/compiler", replacement: abs });
    } else {
      out.push({ find: `@mochi/compiler${key.slice(1)}`, replacement: abs });
    }
  }
  // Longest subpaths first so `plugins/jsx` wins over shorter prefixes.
  return out.toSorted((a, b) => String(b.find).length - String(a.find).length);
};

/** Map `@mochi/{compiler,dx,vite-plugin}` to repo TypeScript sources Vite can resolve. */
export function mochiWorkspaceAliases(repoRoot: string): WorkspaceAlias[] {
  const root = path.resolve(repoRoot);
  return [
    ...compilerAliases(root),
    {
      find: /^@mochi\/dx\/(.+)$/,
      replacement: path.join(root, "packages/dx/src/$1.ts"),
    },
    {
      find: "@mochi/dx",
      replacement: path.join(root, "packages/dx/src/index.ts"),
    },
    {
      find: "@mochi/vite-plugin",
      replacement: path.join(root, "packages/vite-plugin/src/index.ts"),
    },
  ];
}
