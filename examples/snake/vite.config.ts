import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { mochiPlugin } from "../../src/vite-plugin";
import { snakeVendorPlugins } from "./mochi.plugins";

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
    alias: {
      // @styled-cva/react → Preact (see styled-cva Preact compat docs)
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/ws": { target: "ws://localhost:3000", ws: true },
    },
  },
});
