import path from "node:path";
import { mochiPlugin } from "@mochi/vite-plugin";
import { mochiWorkspaceAliases } from "@mochi/vite-plugin/workspace-aliases";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { snakeVendorPlugins } from "./mochi.plugins";

const repoRoot = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  plugins: [
    mochiPlugin({
      jsxPragmaHeader: 'import { h } from "preact";\n',
      plugins: snakeVendorPlugins,
    }),
    preact(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      ...mochiWorkspaceAliases(repoRoot),
      // @styled-cva/react → Preact (see styled-cva Preact compat docs)
      { find: "react", replacement: "preact/compat" },
      { find: "react-dom", replacement: "preact/compat" },
      { find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
    ],
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/ws": { target: "ws://localhost:3000", ws: true },
    },
  },
});
