/**
 * The docs project's vendor-plugin list (#20). *Vendor plugins* are
 * library-owned `HostExtension` adapters (styled-cva, re-reduced, …) — not
 * language core. Vite (`vite.config.ts`), `.d.mochi.ts` generation
 * (`scripts/gen-mochi-dts.ts`), and the docs LSP entry (`src/lsp/docs-server.ts`)
 * all import this one list. Registering a new vendor kit is a one-line edit here.
 */
import { preactExtension } from "@mochi/plugin-preact";
import { reReducedExtension } from "@mochi/plugin-re-reduced";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import type { HostExtension } from "../../src/extensions";

export const docsVendorPlugins: HostExtension[] = [
  styledCvaExtension,
  reReducedExtension,
  preactExtension,
];
