/** Vite aliases so Node/Vite resolve workspace packages into Bun-style TS sources (ADR 0048). */
import path from "node:path";

export type WorkspaceAlias = { find: string | RegExp; replacement: string };

/** Map `@mochi/{compiler,dx,vite-plugin}` to repo TypeScript sources Vite can resolve. */
export function mochiWorkspaceAliases(repoRoot: string): WorkspaceAlias[] {
  const root = path.resolve(repoRoot);
  return [
    {
      find: /^@mochi\/compiler\/(.+)$/,
      replacement: path.join(root, "src/$1.ts"),
    },
    {
      find: "@mochi/compiler",
      replacement: path.join(root, "src/compile.ts"),
    },
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
