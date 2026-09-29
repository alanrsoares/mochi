import * as seed from "../../../../bootstrap/seed/compile.bundle.mjs";
import type { BootstrapDiagnostic, BootstrapInferResult, BootstrapResult } from "./index.ts";
import {
  type BootstrapOptions,
  type BootstrapPlugin,
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
  nominalTypeName: (
    ty: unknown,
    aliases: Map<string, unknown>,
  ) => { _tag: "Some"; value: string } | { _tag: "None" };
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
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  seedCompile.inferTypesWith(src, toSeedOptions({ ...defaultBootstrapOptions, plugins }));

/**
 * Strict single-file check for editor diagnostics: every lex, parse (with
 * recovery, ADR 0045) and check finding, else the first type error. Imports
 * bind nothing here; graph-aware checking is `checkGraphBootstrapRecovering`.
 */
export const checkBootstrapSync = (
  src: string,
  plugins?: readonly BootstrapPlugin[],
): BootstrapDiagnostic[] => {
  const r = seedCompile.inferTypesWith(
    src,
    toSeedOptions({ ...defaultBootstrapOptions, open: false, plugins }),
  );
  return r._tag === "Err" ? r.error : [];
};

/**
 * The declared type a recorded type names, for go-to-type (ADR 0119): its
 * capitalised constructor head, or the nullary record alias its row folds back
 * to under `aliases` (an inference result's own map). Otherwise null.
 */
export const nominalTypeNameBootstrap = (
  ty: unknown,
  aliases: Map<string, unknown>,
): string | null => {
  const name = seedCompile.nominalTypeName(ty, aliases);
  return name._tag === "Some" ? name.value : null;
};
