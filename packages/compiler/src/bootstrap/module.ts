import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { BootstrapDiagnostic, BootstrapModuleOutput, BootstrapResult } from "./index.ts";
import { compileBootstrapSync } from "./sync.ts";

type SeedModule = {
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
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
