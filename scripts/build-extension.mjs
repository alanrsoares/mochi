// Bundle the language server + extension client into packages/vscode/out/.
// Both are CommonJS (the VS Code extension host requires it); `vscode` is
// provided by the host, so it stays external. The server entry is
// `packages/vscode/src/server.ts` loads `mochi.plugins.mjs` / `.mts` per workspace.
import * as esbuild from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: true,
  logLevel: "info",
};

await Promise.all([
  esbuild.build({
    ...common,
    entryPoints: ["packages/vscode/src/server.ts"],
    outfile: "packages/vscode/out/server.js",
  }),
  esbuild.build({
    ...common,
    entryPoints: ["packages/vscode/src/extension.ts"],
    outfile: "packages/vscode/out/extension.js",
    external: ["vscode"],
  }),
]);
