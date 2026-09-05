import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { BootstrapDiagnostic, BootstrapInferResult, BootstrapResult } from "./index.ts";
import { type BootstrapOptions, defaultBootstrapOptions } from "./module.ts";

type SeedCompile = {
  compileWith: (
    src: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic[]>;
  compileTsWith: (
    src: string,
    runtimeImport: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic[]>;
  inferTypesWith: (
    src: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]>;
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/compile.bundle.cjs", import.meta.url)),
) as SeedCompile;

/** Synchronous seam for integrations with sync transform hooks. */
export const compileBootstrapSyncWith = (
  src: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic[]> => seed.compileWith(src, opts);

export const compileBootstrapSync = (src: string): BootstrapResult<string, BootstrapDiagnostic[]> =>
  compileBootstrapSyncWith(src, defaultBootstrapOptions);

export const compileTsBootstrapSyncWith = (
  src: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic[]> => seed.compileTsWith(src, runtimeImport, opts);

export const compileTsBootstrapSync = (
  src: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic[]> =>
  compileTsBootstrapSyncWith(src, runtimeImport, defaultBootstrapOptions);

export const inferTypesBootstrapSync = (
  src: string,
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  seed.inferTypesWith(src, defaultBootstrapOptions);
