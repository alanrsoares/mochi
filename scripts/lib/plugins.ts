import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { docsDxPlugins, docsVendorPlugins } from "../../apps/docs/mochi.plugins";
import { snakeDxPlugins, snakeVendorPlugins } from "../../examples/snake/mochi.plugins";

/**
 * Vendor plugins per app tree (`apps/docs`, `examples/snake`), for the
 * self-hosted core. Other targets stay core-only (returning `undefined`).
 */
export const vendorPluginsFor = (fileOrDir: string): readonly BootstrapPlugin[] | undefined => {
  if (fileOrDir.includes("apps/docs")) return docsVendorPlugins;
  if (fileOrDir.includes("examples/snake")) return snakeVendorPlugins;
  return undefined;
};

/** The same routing for the TypeScript-core DX copies (formatting, until #103). */
export const vendorDxPluginsFor = (fileOrDir: string): readonly LanguagePlugin[] | undefined => {
  if (fileOrDir.includes("apps/docs")) return docsDxPlugins;
  if (fileOrDir.includes("examples/snake")) return snakeDxPlugins;
  return undefined;
};
