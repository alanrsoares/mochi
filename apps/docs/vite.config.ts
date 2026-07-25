import path from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { mochiPlugin } from "../../src/vite-plugin";
import { docsVendorPlugins } from "./mochi.plugins";

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
    alias: {
      "@mochi/compiler": path.resolve(__dirname, "../../src/compile.ts"),
      "@mochi/root": path.resolve(__dirname, "../../"),
      "node:path": path.resolve(__dirname, "node_modules/path-browserify"),
      path: path.resolve(__dirname, "node_modules/path-browserify"),
      // @styled-cva/react → Preact (see styled-cva Preact compat docs)
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  base: "/mochi/",
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        playground: path.resolve(__dirname, "playground.html"),
      },
    },
  },
});
