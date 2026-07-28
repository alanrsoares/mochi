import path from "node:path";
import { mochiPlugin } from "@mochi/vite-plugin";
import { mochiWorkspaceAliases } from "@mochi/vite-plugin/workspace-aliases";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { docsVendorPlugins } from "./mochi.plugins";
import { headChromeHtml } from "./src/lib/head-chrome";

const repoRoot = path.resolve(import.meta.dirname, "../..");

/** Inject the shared head chrome (metas, fonts, pre-paint theme script) into every entry page. */
const headChrome = (): Plugin => ({
  name: "docs-head-chrome",
  transformIndexHtml: {
    order: "pre",
    handler: (html) => html.replace("<!-- head-chrome -->", headChromeHtml),
  },
});

export default defineConfig({
  plugins: [
    headChrome(),
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
        replacement: path.resolve(import.meta.dirname, "node_modules/path-browserify"),
      },
      {
        find: "path",
        replacement: path.resolve(import.meta.dirname, "node_modules/path-browserify"),
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
        main: path.resolve(import.meta.dirname, "index.html"),
        playground: path.resolve(import.meta.dirname, "playground.html"),
        about: path.resolve(import.meta.dirname, "about.html"),
      },
    },
  },
});
