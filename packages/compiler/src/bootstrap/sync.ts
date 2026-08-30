import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { BootstrapDiagnostic, BootstrapResult } from "./index.ts";

type SeedCompile = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic>;
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/compile.bundle.js", import.meta.url)),
) as SeedCompile;

/** Synchronous default-config seam for integrations with sync transform hooks. */
export const compileBootstrapSync = (src: string): BootstrapResult<string, BootstrapDiagnostic> =>
  seed.compile(src);
