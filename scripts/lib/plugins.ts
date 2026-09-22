import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { docsVendorPlugins } from "../../apps/docs/mochi.plugins";
import { snakeVendorPlugins } from "../../examples/snake/mochi.plugins";

/**
 * Vendor plugins per app tree (`apps/docs`, `examples/snake`).
 * Other targets stay core-only (returning `undefined`).
 */
export const vendorPluginsFor = (fileOrDir: string): readonly LanguagePlugin[] | undefined => {
  if (fileOrDir.includes("apps/docs")) return docsVendorPlugins;
  if (fileOrDir.includes("examples/snake")) return snakeVendorPlugins;
  return undefined;
};
