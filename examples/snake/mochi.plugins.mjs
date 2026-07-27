/**
 * Node-loadable vendor-plugin list for the snake example (#20).
 * Vite / gen-mochi-dts still import `mochi.plugins.ts`; keep both in sync.
 */
import { preactExtension } from "@mochi/plugin-preact";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";

export const plugins = [styledCvaExtension, preactExtension, reReducedExtension];
export default plugins;
