import path from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { mochiPlugin } from "../../src/vite-plugin";

export default defineConfig({
  plugins: [
    mochiPlugin({
      jsxPragmaHeader: 'import { h } from "preact";\n',
    }),
    preact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@mochi/compiler": path.resolve(__dirname, "../../src/compile.ts"),
      "@mochi/root": path.resolve(__dirname, "../../"),
    },
  },
  base: "/mochi/",
});
