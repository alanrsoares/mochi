import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { SeedModule } from "../../../../bootstrap/seed/module-host-types";
import type {
  BootstrapDiagnostic,
  BootstrapExportOrigins,
  BootstrapGraphInferOutput,
  BootstrapGraphInferState,
  BootstrapModuleOutput,
  BootstrapOccurrence,
  BootstrapPrelude,
  BootstrapRecoveryGraphState,
  BootstrapResult,
  BootstrapSymbolIndex,
} from "./index.ts";
import {
  type BootstrapOptions,
  type BootstrapPlugin,
  defaultBootstrapOptions,
  editorBootstrapOptions,
  toSeedOptions,
} from "./options.ts";
import { loadSeed, seedPath } from "./seed-path.ts";
import type { Stmt } from "./types.ts";

export type { BootstrapOptions };
export { defaultBootstrapOptions, editorBootstrapOptions };

/** A parsed graph module. `src` travels so each file's `"use open"` is visible. */
export type BootstrapGraphModule = { path: string; src: string; stmts: Stmt[] };
export type BootstrapGraphRecovery = {
  outputs: BootstrapModuleOutput[];
  errors: BootstrapDiagnostic[];
};

const seed = loadSeed<SeedModule>("module.bundle.cjs");

/**
 * Identifies the frozen seed: a hash of its manifest, which already hashes every
 * seed file. Output caches key on it so a refreeze invalidates them.
 */
export const bootstrapSeedId = (): string =>
  createHash("sha256")
    .update(readFileSync(seedPath("manifest.json")))
    .digest("hex");

export const buildModulesBootstrapWith = (
  entry: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]> =>
  seed.buildModulesWith(entry, toSeedOptions(opts));

export const buildModulesBootstrap = (
  entry: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]> =>
  buildModulesBootstrapWith(entry, defaultBootstrapOptions);

export const buildModulesTsBootstrapWith = (
  entry: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]> =>
  seed.buildModulesTsWith(entry, runtimeImport, toSeedOptions(opts));

export const buildModulesTsBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]> =>
  buildModulesTsBootstrapWith(entry, runtimeImport, defaultBootstrapOptions);

export const compileGraphBootstrap = (
  modules: BootstrapGraphModule[],
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic[]> =>
  seed.compileGraphWith(modules, toSeedOptions({ ...editorBootstrapOptions, plugins }));

export const inferGraphTypesBootstrap = (
  modules: BootstrapGraphModule[],
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic> =>
  seed.inferGraphTypesWith(modules, toSeedOptions({ ...defaultBootstrapOptions, plugins }));

export const freshInferGraphStateBootstrap = (): BootstrapGraphInferState =>
  seed.freshInferGraphState();

export const inferGraphTypesFromBootstrap = (
  state: BootstrapGraphInferState,
  modules: BootstrapGraphModule[],
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic> =>
  seed.inferGraphTypesFromWith(
    state,
    modules,
    toSeedOptions({ ...defaultBootstrapOptions, plugins }),
  );

export const freshRecoveryGraphStateBootstrap = (): BootstrapRecoveryGraphState =>
  seed.freshRecoveryGraphState();

/**
 * Recover one module over a state holding its dependencies. `isEntry` says
 * whether it is the graph entry, which `strictEntry` judges strictly.
 */
export const recoverModuleBootstrap = (
  state: BootstrapRecoveryGraphState,
  module: BootstrapGraphModule,
  isEntry: boolean,
  plugins?: readonly BootstrapPlugin[],
): BootstrapRecoveryGraphState =>
  seed.recoverModuleWith(
    state,
    module,
    isEntry,
    toSeedOptions({ ...editorBootstrapOptions, plugins }),
  );

/** The entries `path` published into `state`, with no errors (ADR 0111). */
export const recoverySliceOfBootstrap = (
  state: BootstrapRecoveryGraphState,
  path: string,
): BootstrapRecoveryGraphState => seed.recoverySliceOf(state, path);

/** `b`'s modules after `a`'s. */
export const mergeRecoveryStatesBootstrap = (
  a: BootstrapRecoveryGraphState,
  b: BootstrapRecoveryGraphState,
): BootstrapRecoveryGraphState => seed.mergeRecoveryStates(a, b);

/** The entries and typed output `path` added to `state` (ADR 0111). */
export const inferSliceOfBootstrap = (
  state: BootstrapGraphInferState,
  path: string,
): BootstrapGraphInferState => seed.inferSliceOf(state, path);

/** `b`'s modules after `a`'s. */
export const mergeInferStatesBootstrap = (
  a: BootstrapGraphInferState,
  b: BootstrapGraphInferState,
): BootstrapGraphInferState => seed.mergeInferStates(a, b);

export const compileGraphBootstrapRecovering = (
  modules: BootstrapGraphModule[],
  plugins?: readonly BootstrapPlugin[],
): BootstrapGraphRecovery =>
  seed.compileGraphRecoveringWith(modules, toSeedOptions({ ...editorBootstrapOptions, plugins }));

export const exportedOriginsBootstrap = (path: string, stmts: Stmt[]): BootstrapExportOrigins =>
  seed.exportedOrigins(path, stmts);

export const symbolOccurrencesBootstrap = (stmts: readonly Stmt[]): BootstrapOccurrence[] =>
  seed.symbolOccurrences(stmts as Stmt[]);

/** The full symbol index of `stmts` at `path` (`bootstrap/symbols.mochi`). */
export const symbolIndexBootstrap = (
  path: string,
  origins: BootstrapExportOrigins,
  prelude: BootstrapPrelude,
  stmts: Stmt[],
): BootstrapSymbolIndex => seed.symbolIndex(path, origins, prelude, stmts) as BootstrapSymbolIndex;

/** `.d.ts` text for one source file, emitted by the frozen bootstrap graph. */
export const emitDtsBootstrap = (
  src: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic[]> => seed.emitDts(src, runtimeImport);

/**
 * `.d.ts` for one file, typed through its own import graph so a namespace-
 * imported type prints as `Alias.T` (ADR 0046). Reads dependencies from disk
 * through the seed's own host shim, like the other graph entry points.
 */
export const emitDtsForFileBootstrapWith = (
  entry: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<string, BootstrapDiagnostic> =>
  seed.emitDtsForFileWith(entry, runtimeImport, toSeedOptions(opts));

export const emitDtsForFileBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic> =>
  emitDtsForFileBootstrapWith(entry, runtimeImport, defaultBootstrapOptions);
