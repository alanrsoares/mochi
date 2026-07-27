import path from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
// Relative entry: Vite loads the config under Node, which cannot follow
// `@mochi/compiler` package exports into extensionless `src/*.ts` (ADR 0048).
import { mochiPlugin } from "../../packages/vite-plugin/src/index";
import { mochiWorkspaceAliases } from "../../packages/vite-plugin/src/workspace-aliases";
import { docsVendorPlugins } from "./mochi.plugins";

const repoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [
    mochiPlugin({
      jsxPragmaHeader: 'import { h } from "preact";\n',
      plugins: docsVendorPlugins,
    }),
    preact(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      ...mochiWorkspaceAliases(repoRoot),
      { find: "@mochi/root", replacement: repoRoot },
      {
        find: "@mochi/plugin-preact/hooks",
        replacement: path.resolve(repoRoot, "packages/plugin-preact/hooks.mochi"),
      },
      {
        find: "node:path",
        replacement: path.resolve(__dirname, "node_modules/path-browserify"),
      },
      {
        find: "path",
        replacement: path.resolve(__dirname, "node_modules/path-browserify"),
      },
      // @styled-cva/react → Preact (see styled-cva Preact compat docs)
      { find: "react", replacement: "preact/compat" },
      { find: "react-dom", replacement: "preact/compat" },
      { find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
    ],
  },
  base: "/mochi/",
  // The compile worker lazily imports the pretty-printer, and code-splitting a
  // worker requires an ES-module worker — Vite's default `iife` cannot express
  // a dynamic import.
  worker: { format: "es" },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        playground: path.resolve(__dirname, "playground.html"),
      },
    },
  },
});
