import * as seed from "../../../../bootstrap/seed/compile.bundle.mjs";
import type { BootstrapDiagnostic, BootstrapInferResult, BootstrapResult } from "./index.ts";
import {
  type BootstrapOptions,
  defaultBootstrapOptions,
  type SeedOptions,
  toSeedOptions,
} from "./options.ts";

type SeedCompile = {
  compileWith: (src: string, opts: SeedOptions) => BootstrapResult<string, BootstrapDiagnostic[]>;
  compileTsWith: (
    src: string,
    runtimeImport: string,
    opts: SeedOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic[]>;
  inferTypesWith: (
    src: string,
    opts: SeedOptions,
  ) => BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]>;
};

const seedCompile = seed as unknown as SeedCompile;

/** Synchronous seam for integrations with sync transform hooks. */
export const compileBootstrapSyncWith = (
  src: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic[]> =>
  seedCompile.compileWith(src, toSeedOptions(opts));

export const compileBootstrapSync = (src: string): BootstrapResult<string, BootstrapDiagnostic[]> =>
  compileBootstrapSyncWith(src, defaultBootstrapOptions);

export const compileTsBootstrapSyncWith = (
  src: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic[]> =>
  seedCompile.compileTsWith(src, runtimeImport, toSeedOptions(opts));

export const compileTsBootstrapSync = (
  src: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic[]> =>
  compileTsBootstrapSyncWith(src, runtimeImport, defaultBootstrapOptions);

export const inferTypesBootstrapSync = (
  src: string,
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  seedCompile.inferTypesWith(src, toSeedOptions(defaultBootstrapOptions));
