/// <reference types="vite/client" />

// `.mochi` modules are typed per-module by generated `*.d.mochi.ts` sidecars
// (`bun run gen:mochi-dts`), not by a wildcard ambient declaration.

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

/** Tour snippets imported as source text for HighlightCode (not compiled modules). */
declare module "*.mochi?raw" {
  const source: string;
  export default source;
}
