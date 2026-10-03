/**
 * Docs vendor-plugin list (#20). Vite, `gen-mochi-dts`, and the LSP (walks
 * upward for `mochi.plugins.ts`) all read this one file.
 *
 * `plugins` (also the default export) runs on the self-hosted core (ADR 0109),
 * for the build and every editor query (ADR 0123).
 */

import type { CompilerPlugin } from "@mochi/compiler/extensions";
import { preactPlugin } from "@mochi/plugin-preact";
import { reReducedPlugin } from "@mochi/plugin-re-reduced";
import { styledCvaPlugin } from "@mochi/plugin-styled-cva";

export const docsVendorPlugins: CompilerPlugin[] = [styledCvaPlugin, reReducedPlugin, preactPlugin];

/** LSP contract: `default` or named `plugins`. */
export const plugins = docsVendorPlugins;
export default plugins;
