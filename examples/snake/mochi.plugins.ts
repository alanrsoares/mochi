/**
 * Snake example vendor-plugin list (#20). Vite, `gen-mochi-dts`, and the LSP
 * all read this one file.
 *
 * `plugins` (also the default export) runs on the self-hosted core (ADR 0109),
 * for the build and every editor query (ADR 0123).
 */

import type { CompilerPlugin } from "@mochi/compiler/extensions";
import { preactPlugin } from "@mochi/plugin-preact";
import { reReducedPlugin } from "@mochi/plugin-re-reduced";
import { styledCvaPlugin } from "@mochi/plugin-styled-cva";

export const snakeVendorPlugins: CompilerPlugin[] = [
  styledCvaPlugin,
  preactPlugin,
  reReducedPlugin,
];

/** LSP contract: `default` or named `plugins`. */
export const plugins = snakeVendorPlugins;
export default plugins;
