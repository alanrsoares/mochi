// The Bun `.mochi` loader lives in `@mochi/bun/plugin` (ADR 0108); re-exported so
// the ADR 0086 entry point keeps working.
export { compileMochiFile, compileMochiGraph, mochiPlugin } from "@mochi/bun/plugin";
