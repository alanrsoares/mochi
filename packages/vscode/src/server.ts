/**
 * Bundled LSP entry for the editor extension. Vendor plugins are resolved from
 * each workspace's `mochi.plugins.mjs` / `.mts` (see extension init options).
 */
import { startServer } from "@mochi/lsp";

startServer();
