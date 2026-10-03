import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Result } from "@onrails/result";
import type { SeedModule } from "../../../../bootstrap/seed/module-host-types";
import {
  type CompilerOptions,
  type CompilerPlugin,
  defaultOptions,
  editorOptions,
  toSeedOptions,
} from "../extensions/options.ts";
import type { Stmt } from "../infer/host-types.ts";
import { loadSeed, seedPath } from "../seed/loader.ts";
import type {
  CompilerDiagnostic,
  CompilerExportOrigins,
  CompilerGraphInferOutput,
  CompilerGraphInferState,
  CompilerModuleOutput,
  CompilerOccurrence,
  CompilerPrelude,
  CompilerRecoveryGraphState,
  CompilerSymbolIndex,
} from "./graph.ts";

export type { CompilerOptions };
export { defaultOptions, editorOptions };

/** A parsed graph module. `src` travels so each file's `"use open"` is visible. */
export type CompilerGraphModule = { path: string; src: string; stmts: Stmt[] };
export type CompilerGraphRecovery = {
  outputs: CompilerModuleOutput[];
  errors: CompilerDiagnostic[];
};

const seed = loadSeed<SeedModule>("module.bundle.cjs");

/**
 * Identifies the frozen seed: a hash of its manifest, which already hashes every
 * seed file. Output caches key on it so a refreeze invalidates them.
 */
export const compilerSeedId = (): string =>
  createHash("sha256")
    .update(readFileSync(seedPath("manifest.json")))
    .digest("hex");

export const buildModulesWith = (
  entry: string,
  opts: CompilerOptions,
): Result<CompilerModuleOutput[], CompilerDiagnostic[]> =>
  seed.buildModulesWith(entry, toSeedOptions(opts));

export const buildModules = (entry: string): Result<CompilerModuleOutput[], CompilerDiagnostic[]> =>
  buildModulesWith(entry, defaultOptions);

export const buildModulesTsWith = (
  entry: string,
  runtimeImport: string,
  opts: CompilerOptions,
): Result<CompilerModuleOutput[], CompilerDiagnostic[]> =>
  seed.buildModulesTsWith(entry, runtimeImport, toSeedOptions(opts));

export const buildModulesTs = (
  entry: string,
  runtimeImport: string,
): Result<CompilerModuleOutput[], CompilerDiagnostic[]> =>
  buildModulesTsWith(entry, runtimeImport, defaultOptions);

export const compileGraph = (
  modules: CompilerGraphModule[],
  plugins?: readonly CompilerPlugin[],
): Result<CompilerModuleOutput[], CompilerDiagnostic[]> =>
  seed.compileGraphWith(modules, toSeedOptions({ ...editorOptions, plugins }));

export const inferGraphTypes = (
  modules: CompilerGraphModule[],
  plugins?: readonly CompilerPlugin[],
): Result<CompilerGraphInferOutput[], CompilerDiagnostic> =>
  seed.inferGraphTypesWith(modules, toSeedOptions({ ...defaultOptions, plugins }));

export const freshInferGraphState = (): CompilerGraphInferState => seed.freshInferGraphState();

export const inferGraphTypesFrom = (
  state: CompilerGraphInferState,
  modules: CompilerGraphModule[],
  plugins?: readonly CompilerPlugin[],
): Result<CompilerGraphInferState, CompilerDiagnostic> =>
  seed.inferGraphTypesFromWith(state, modules, toSeedOptions({ ...defaultOptions, plugins }));

export const freshRecoveryGraphState = (): CompilerRecoveryGraphState =>
  seed.freshRecoveryGraphState();

/**
 * Recover one module over a state holding its dependencies. `isEntry` says
 * whether it is the graph entry, which `strictEntry` judges strictly.
 */
export const recoverModule = (
  state: CompilerRecoveryGraphState,
  module: CompilerGraphModule,
  isEntry: boolean,
  plugins?: readonly CompilerPlugin[],
): CompilerRecoveryGraphState =>
  seed.recoverModuleWith(state, module, isEntry, toSeedOptions({ ...editorOptions, plugins }));

/** The entries `path` published into `state`, with no errors (ADR 0111). */
export const recoverySliceOf = (
  state: CompilerRecoveryGraphState,
  path: string,
): CompilerRecoveryGraphState => seed.recoverySliceOf(state, path);

/** `b`'s modules after `a`'s. */
export const mergeRecoveryStates = (
  a: CompilerRecoveryGraphState,
  b: CompilerRecoveryGraphState,
): CompilerRecoveryGraphState => seed.mergeRecoveryStates(a, b);

/** The entries and typed output `path` added to `state` (ADR 0111). */
export const inferSliceOf = (
  state: CompilerGraphInferState,
  path: string,
): CompilerGraphInferState => seed.inferSliceOf(state, path);

/** `b`'s modules after `a`'s. */
export const mergeInferStates = (
  a: CompilerGraphInferState,
  b: CompilerGraphInferState,
): CompilerGraphInferState => seed.mergeInferStates(a, b);

export const compileGraphRecovering = (
  modules: CompilerGraphModule[],
  plugins?: readonly CompilerPlugin[],
): CompilerGraphRecovery =>
  seed.compileGraphRecoveringWith(modules, toSeedOptions({ ...editorOptions, plugins }));

export const exportedOrigins = (path: string, stmts: Stmt[]): CompilerExportOrigins =>
  seed.exportedOrigins(path, stmts);

export const symbolOccurrences = (stmts: readonly Stmt[]): CompilerOccurrence[] =>
  seed.symbolOccurrences(stmts as Stmt[]);

/** The full symbol index of `stmts` at `path` (`packages/compiler/src/check/symbols.mochi`). */
export const symbolIndex = (
  path: string,
  origins: CompilerExportOrigins,
  prelude: CompilerPrelude,
  stmts: Stmt[],
): CompilerSymbolIndex => seed.symbolIndex(path, origins, prelude, stmts) as CompilerSymbolIndex;

/** `.d.ts` text for one source file, emitted by the frozen bootstrap graph. */
export const emitDts = (src: string, runtimeImport: string): Result<string, CompilerDiagnostic[]> =>
  seed.emitDts(src, runtimeImport);

/**
 * `.d.ts` for one file, typed through its own import graph so a namespace-
 * imported type prints as `Alias.T` (ADR 0046). Reads dependencies from disk
 * through the seed's own host shim, like the other graph entry points.
 */
export const emitDtsForFileWith = (
  entry: string,
  runtimeImport: string,
  opts: CompilerOptions,
): Result<string, CompilerDiagnostic> =>
  seed.emitDtsForFileWith(entry, runtimeImport, toSeedOptions(opts));

export const emitDtsForFile = (
  entry: string,
  runtimeImport: string,
): Result<string, CompilerDiagnostic> => emitDtsForFileWith(entry, runtimeImport, defaultOptions);
