import * as seed from "../../../../bootstrap/seed/compile.bundle.mjs";
import type {
  BootstrapDiagnostic,
  BootstrapExportOrigins,
  BootstrapInferResult,
  BootstrapPrelude,
  BootstrapResult,
  BootstrapSymbolIndex,
} from "./index.ts";
import {
  type BootstrapOptions,
  type BootstrapPlugin,
  defaultBootstrapOptions,
  type SeedOptions,
  toSeedOptions,
} from "./options.ts";

/** One file's JS, typed TS and `.d.ts`, printed from one inference. */
export type BootstrapTargets = { js: string; ts: string; dts: string };

type SeedCompile = {
  compileWith: (src: string, opts: SeedOptions) => BootstrapResult<string, BootstrapDiagnostic[]>;
  compileTsWith: (
    src: string,
    runtimeImport: string,
    opts: SeedOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic[]>;
  compileTargetsWith: (
    src: string,
    runtimeImport: string,
    opts: SeedOptions,
  ) => BootstrapResult<BootstrapTargets, BootstrapDiagnostic[]>;
  emitDtsTextWith: (
    src: string,
    runtimeImport: string,
    opts: SeedOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic[]>;
  inferTypesWith: (
    src: string,
    opts: SeedOptions,
  ) => BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]>;
  inferTypesRecoveringWith: (
    src: string,
    opts: SeedOptions,
  ) => BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]>;
  nominalTypeName: (
    ty: unknown,
    aliases: Map<string, unknown>,
  ) => { _tag: "Some"; value: string } | { _tag: "None" };
  symbolIndexSync: (
    path: string,
    origins: BootstrapExportOrigins,
    prelude: BootstrapPrelude,
    stmts: unknown,
  ) => BootstrapSymbolIndex;
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

/** Single-file `.d.ts`; imports bind nothing (graphs use `emitDtsForFileBootstrapWith`). */
export const emitDtsBootstrapSyncWith = (
  src: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic[]> =>
  seedCompile.emitDtsTextWith(src, runtimeImport, toSeedOptions(opts));

/** Every emit target from one inference, for the docs playground (browser-safe). */
export const compileTargetsBootstrapSyncWith = (
  src: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapTargets, BootstrapDiagnostic[]> =>
  seedCompile.compileTargetsWith(src, runtimeImport, toSeedOptions(opts));

export const inferTypesBootstrapSyncWith = (
  src: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  seedCompile.inferTypesWith(src, toSeedOptions(opts));

export const inferTypesBootstrapSync = (
  src: string,
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  inferTypesBootstrapSyncWith(src, { ...defaultBootstrapOptions, plugins });

/**
 * `inferTypesBootstrapSync` over the statements a recovering parse keeps, so a
 * hole elsewhere in the buffer does not blank the whole table (ADR 0120).
 */
export const inferTypesRecoveringBootstrapSync = (
  src: string,
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapInferResult, BootstrapDiagnostic[]> =>
  seedCompile.inferTypesRecoveringWith(src, toSeedOptions({ ...defaultBootstrapOptions, plugins }));

/**
 * Strict single-file check for editor diagnostics: every lex, parse (with
 * recovery, ADR 0045) and check finding, else every type error. Imports
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

/**
 * The full symbol index (ADR 0118) from the synchronous bundle, so browser
 * callers (docs-site hover) can index without the Node-only module seed.
 */
export const symbolIndexBootstrapSync = (
  path: string,
  origins: BootstrapExportOrigins,
  prelude: BootstrapPrelude,
  stmts: unknown,
): BootstrapSymbolIndex => seedCompile.symbolIndexSync(path, origins, prelude, stmts);
