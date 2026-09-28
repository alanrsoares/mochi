/**
 * Docs vendor-plugin list (#20). Vite, `gen-mochi-dts`, and the LSP (walks
 * upward for `mochi.plugins.ts`) all read this one file.
 *
 * `plugins` (also the default export) runs on the self-hosted core (ADR 0109).
 * `dxPlugins` is the same list for the TypeScript core, which still answers
 * hover, completion, and navigation until #103 moves them.
 */

import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { preactExtension } from "@mochi/plugin-preact";
import { preactBootstrap } from "@mochi/plugin-preact/bootstrap";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { reReducedBootstrap } from "@mochi/plugin-re-reduced/bootstrap";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { styledCvaBootstrap } from "@mochi/plugin-styled-cva/bootstrap";

export const docsVendorPlugins: BootstrapPlugin[] = [
  styledCvaBootstrap,
  reReducedBootstrap,
  preactBootstrap,
];

/** TypeScript-core copy of {@link docsVendorPlugins}, for DX only (#103). */
export const docsDxPlugins: LanguagePlugin[] = [
  styledCvaExtension,
  reReducedExtension,
  preactExtension,
];

/** LSP contract: `default` or named `plugins`, and an optional `dxPlugins`. */
export const plugins = docsVendorPlugins;
export const dxPlugins = docsDxPlugins;
export default plugins;
