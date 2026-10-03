import type { Result } from "@onrails/result";
import * as seed from "../../../../bootstrap/seed/compile.bundle.mjs";
import {
  type CompilerOptions,
  type CompilerPlugin,
  defaultOptions,
  toSeedOptions,
} from "../extensions/options.ts";
import type {
  CompilerDiagnostic,
  CompilerExportOrigins,
  CompilerInferResult,
  CompilerPrelude,
  CompilerSymbolIndex,
} from "../module/graph.ts";

/** One file's JS, typed TS and `.d.ts`, printed from one inference. */
export type CompilerTargets = { js: string; ts: string; dts: string };

import type { AliasInfo, Stmt, Ty } from "../infer/host-types.ts";

const seedCompile = seed;

/** Runtime's public annotation, printed from the seed prelude's HM signature. */
export const runtimeAnnotationSync = (name: string, arity: number): string | null => {
  const annotation = seedCompile.runtimeAnnotation(name, arity);
  return annotation._tag === "Some" ? annotation.value : null;
};

/** Synchronous seam for integrations with sync transform hooks. */
export const compileSyncWith = (
  src: string,
  opts: CompilerOptions,
): Result<string, CompilerDiagnostic[]> => seedCompile.compileWith(src, toSeedOptions(opts));

export const compileSync = (src: string): Result<string, CompilerDiagnostic[]> =>
  compileSyncWith(src, defaultOptions);

export const compileTsSyncWith = (
  src: string,
  runtimeImport: string,
  opts: CompilerOptions,
): Result<string, CompilerDiagnostic[]> =>
  seedCompile.compileTsWith(src, runtimeImport, toSeedOptions(opts));

export const compileTsSync = (
  src: string,
  runtimeImport: string,
): Result<string, CompilerDiagnostic[]> => compileTsSyncWith(src, runtimeImport, defaultOptions);

/** Single-file `.d.ts`; imports bind nothing (graphs use `emitDtsForFileWith`). */
export const emitDtsSyncWith = (
  src: string,
  runtimeImport: string,
  opts: CompilerOptions,
): Result<string, CompilerDiagnostic[]> =>
  seedCompile.emitDtsTextWith(src, runtimeImport, toSeedOptions(opts));

/** Every emit target from one inference, for the docs playground (browser-safe). */
export const compileTargetsSyncWith = (
  src: string,
  runtimeImport: string,
  opts: CompilerOptions,
): Result<CompilerTargets, CompilerDiagnostic[]> =>
  seedCompile.compileTargetsWith(src, runtimeImport, toSeedOptions(opts));

export const inferTypesSyncWith = (
  src: string,
  opts: CompilerOptions,
): Result<CompilerInferResult, CompilerDiagnostic[]> =>
  seedCompile.inferTypesWith(src, toSeedOptions(opts));

export const inferTypesSync = (
  src: string,
  plugins?: readonly CompilerPlugin[],
): Result<CompilerInferResult, CompilerDiagnostic[]> =>
  inferTypesSyncWith(src, { ...defaultOptions, plugins });

/**
 * `inferTypesSync` over the statements a recovering parse keeps, so a
 * hole elsewhere in the buffer does not blank the whole table (ADR 0120).
 */
export const inferTypesRecoveringSync = (
  src: string,
  plugins?: readonly CompilerPlugin[],
): Result<CompilerInferResult, CompilerDiagnostic[]> =>
  seedCompile.inferTypesRecoveringWith(src, toSeedOptions({ ...defaultOptions, plugins }));

/**
 * Strict single-file check for editor diagnostics: every lex, parse (with
 * recovery, ADR 0045) and check finding, else every type error. Imports
 * bind nothing here; graph-aware checking is `checkGraphRecovering`.
 */
export const checkSync = (
  src: string,
  plugins?: readonly CompilerPlugin[],
): CompilerDiagnostic[] => {
  const r = seedCompile.inferTypesWith(
    src,
    toSeedOptions({ ...defaultOptions, open: false, plugins }),
  );
  return r._tag === "Err" ? r.error : [];
};

/**
 * The declared type a recorded type names, for go-to-type (ADR 0119): its
 * capitalised constructor head, or the nullary record alias its row folds back
 * to under `aliases` (an inference result's own map). Otherwise null.
 */
export const nominalTypeName = (ty: Ty, aliases: Map<string, AliasInfo>): string | null => {
  const name = seedCompile.nominalTypeName(ty, aliases);
  return name._tag === "Some" ? name.value : null;
};

/**
 * The full symbol index (ADR 0118) from the synchronous bundle, so browser
 * callers (docs-site hover) can index without the Node-only module seed.
 */
export const symbolIndexSync = (
  path: string,
  origins: CompilerExportOrigins,
  prelude: CompilerPrelude,
  stmts: readonly Stmt[],
): CompilerSymbolIndex =>
  seedCompile.symbolIndexSync(path, origins, prelude, stmts as Stmt[]) as CompilerSymbolIndex;
