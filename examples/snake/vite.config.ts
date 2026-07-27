import path from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
// Relative entry: Vite loads the config under Node, which cannot follow
// `@mochi/compiler` package exports into extensionless `src/*.ts` (ADR 0048).
import { mochiPlugin } from "../../packages/vite-plugin/src/index";
import { mochiWorkspaceAliases } from "../../packages/vite-plugin/src/workspace-aliases";
import { snakeVendorPlugins } from "./mochi.plugins";

const repoRoot = path.resolve(__dirname, "../..");

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
