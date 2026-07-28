/**
 * Snake example vendor-plugin list (#20). Vite, `gen-mochi-dts`, and the LSP
 * all read this one file.
 */

import type { HostExtension } from "@mochi/compiler/extensions";
import { preactExtension } from "@mochi/plugin-preact";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";

export const snakeVendorPlugins: HostExtension[] = [
  styledCvaExtension,
  preactExtension,
  reReducedExtension,
];

/** LSP contract: `default` or named `plugins`. */
export const plugins = snakeVendorPlugins;
export default plugins;
