import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { BootstrapDiagnostic, BootstrapModuleOutput, BootstrapResult } from "./index.ts";

type SeedModule = {
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/module.bundle.js", import.meta.url)),
) as SeedModule;

export const buildModulesBootstrap = (
  entry: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> => seed.buildModules(entry);

export const buildModulesTsBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  seed.buildModulesTs(entry, runtimeImport);
