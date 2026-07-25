/**
 * The docs project's vendor-plugin list (#20). *Vendor plugins* are
 * library-owned `HostExtension` adapters (styled-cva today, re-reduced
 * later) — not language core. Vite (`vite.config.ts`), `.d.mochi.ts`
 * generation (`scripts/gen-mochi-dts.ts`), and the docs LSP entry
 * (`src/lsp/docs-server.ts`) all import this one list instead of
 * hand-duplicating it. Registering a new vendor kit is a one-line edit here.
 */
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import type { HostExtension } from "../../src/extensions";

export const docsVendorPlugins: HostExtension[] = [styledCvaExtension];
