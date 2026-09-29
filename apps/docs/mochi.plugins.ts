/**
 * Docs vendor-plugin list (#20). Vite, `gen-mochi-dts`, and the LSP (walks
 * upward for `mochi.plugins.ts`) all read this one file.
 *
 * `plugins` (also the default export) runs on the self-hosted core (ADR 0109),
 * for the build and every editor query (ADR 0123).
 */

import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import { preactBootstrap } from "@mochi/plugin-preact/bootstrap";
import { reReducedBootstrap } from "@mochi/plugin-re-reduced/bootstrap";
import { styledCvaBootstrap } from "@mochi/plugin-styled-cva/bootstrap";

export const docsVendorPlugins: BootstrapPlugin[] = [
  styledCvaBootstrap,
  reReducedBootstrap,
  preactBootstrap,
];

/** LSP contract: `default` or named `plugins`. */
export const plugins = docsVendorPlugins;
export default plugins;
