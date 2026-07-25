/**
 * VS Code extension entry for the docs project (#20). Thin wrapper around
 * `startServer` that supplies the docs project's vendor-plugin list — the
 * same one Vite / `gen-mochi-dts` consume (`apps/docs/mochi.plugins.ts`) —
 * so hover/diagnostics in the shipped extension match what the docs app
 * actually types. `startServer` itself stays free of any concrete plugin.
 * `scripts/build-extension.mjs` bundles this file (not `./server.ts`
 * directly) into `editors/vscode/out/server.js`.
 */
import { docsVendorPlugins } from "../../apps/docs/mochi.plugins";
import { startServer } from "./server";

startServer({ extensions: docsVendorPlugins });
