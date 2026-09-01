import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type {
  BootstrapDiagnostic,
  BootstrapExportOrigins,
  BootstrapGraphInferOutput,
  BootstrapGraphInferState,
  BootstrapModuleOutput,
  BootstrapOccurrence,
  BootstrapRecoveryGraphState,
  BootstrapResult,
} from "./index.ts";
import { compileBootstrapSync } from "./sync.ts";

type SeedModule = {
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  compileGraph: (
    modules: BootstrapGraphModule[],
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  inferGraphTypes: (
    modules: BootstrapGraphModule[],
  ) => BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>;
  freshInferGraphState: () => BootstrapGraphInferState;
  inferGraphTypesFrom: (
    state: BootstrapGraphInferState,
    modules: BootstrapGraphModule[],
  ) => BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic>;
  freshRecoveryGraphState: () => BootstrapRecoveryGraphState;
  recoverGraphFrom: (
    state: BootstrapRecoveryGraphState,
    modules: BootstrapGraphModule[],
  ) => BootstrapRecoveryGraphState;
  compileGraphRecovering: (modules: BootstrapGraphModule[]) => BootstrapGraphRecovery;
  exportedOrigins: (stmts: unknown) => BootstrapExportOrigins;
  symbolOccurrences: (stmts: unknown) => BootstrapOccurrence[];
};

export type BootstrapGraphModule = { path: string; stmts: unknown };
export type BootstrapGraphRecovery = {
  outputs: BootstrapModuleOutput[];
  errors: BootstrapDiagnostic[];
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/module.bundle.cjs", import.meta.url)),
) as SeedModule;

export const buildModulesBootstrap = (
  entry: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> => {
  const result = seed.buildModules(entry);
  if (result._tag === "Err") return result;
  const source = readFileSync(entry, "utf8");
  if (!/^\s*import\b/m.test(source)) {
    const strict = compileBootstrapSync(source);
    if (strict._tag === "Err") return strict;
  }
  return {
    _tag: "Ok",
    value: result.value.map((output) => ({
      ...output,
      js: output.js.replace(/(from\s+["'][^"']+)\.js(["'])/g, "$1.mochi$2"),
    })),
  };
};

export const buildModulesTsBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  seed.buildModulesTs(entry, runtimeImport);

export const compileGraphBootstrap = (
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> => seed.compileGraph(modules);

export const inferGraphTypesBootstrap = (
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic> =>
  seed.inferGraphTypes(modules);

export const freshInferGraphStateBootstrap = (): BootstrapGraphInferState =>
  seed.freshInferGraphState();

export const inferGraphTypesFromBootstrap = (
  state: BootstrapGraphInferState,
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic> =>
  seed.inferGraphTypesFrom(state, modules);

export const freshRecoveryGraphStateBootstrap = (): BootstrapRecoveryGraphState =>
  seed.freshRecoveryGraphState();

export const recoverGraphFromBootstrap = (
  state: BootstrapRecoveryGraphState,
  modules: BootstrapGraphModule[],
): BootstrapRecoveryGraphState => seed.recoverGraphFrom(state, modules);

export const compileGraphBootstrapRecovering = (
  modules: BootstrapGraphModule[],
): BootstrapGraphRecovery => seed.compileGraphRecovering(modules);

export const exportedOriginsBootstrap = (stmts: unknown): BootstrapExportOrigins =>
  seed.exportedOrigins(stmts);

export const symbolOccurrencesBootstrap = (stmts: unknown): BootstrapOccurrence[] =>
  seed.symbolOccurrences(stmts);
