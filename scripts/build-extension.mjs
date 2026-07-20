// Bundle the language server + extension client into editors/vscode/out/.
// Both are CommonJS (the VS Code extension host requires it); `vscode` is
// provided by the host, so it stays external.
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
    entryPoints: ["src/lsp/server.ts"],
    outfile: "editors/vscode/out/server.js",
  }),
  esbuild.build({
    ...common,
    entryPoints: ["editors/vscode/src/extension.ts"],
    outfile: "editors/vscode/out/extension.js",
    external: ["vscode"],
  }),
]);
