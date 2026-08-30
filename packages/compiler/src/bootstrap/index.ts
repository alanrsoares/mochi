/**
 * The executable self-hosted compiler core (ADR 0090).
 *
 * `bootstrap/seed/` is a manifest-verified TypeScript graph emitted from
 * `bootstrap/*.mochi`; it is not an authoring surface. This module gives host
 * tools one explicit import boundary for that graph while formatter and editor
 * queries remain TypeScript-owned (ADR 0078).
 */
export type BootstrapResult<A, E> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: E };

export type BootstrapDiagnostic = { message: string; start: number; end: number };

export type BootstrapModuleOutput = { path: string; js: string };

export type BootstrapCore = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic>;
  compileTs: (src: string, runtimeImport: string) => BootstrapResult<string, BootstrapDiagnostic>;
  buildModules: (entry: string) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTs: (
    entry: string,
    runtimeImport: string,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
};

/**
 * Load the frozen stage-1 graph on demand.
 *
 * The generated graph is checked by ADR 0090's strict-TS north star, but the
 * workspace deliberately adds `noUncheckedIndexedAccess`. Loading it through
 * this typed boundary prevents that stronger host policy from becoming an
 * accidental requirement of the emitted artifact.
 */
export const loadBootstrapCore = async (): Promise<BootstrapCore> => {
  const root = new URL("../../../../bootstrap/seed/", import.meta.url);
  const [compile, module] = await Promise.all([
    import(new URL("compile.ts", root).href),
    import(new URL("module.ts", root).href),
  ]);

  return {
    compile: compile.compile as BootstrapCore["compile"],
    compileTs: compile.compileTs as BootstrapCore["compileTs"],
    buildModules: module.buildModules as BootstrapCore["buildModules"],
    buildModulesTs: module.buildModulesTs as BootstrapCore["buildModulesTs"],
  };
};
