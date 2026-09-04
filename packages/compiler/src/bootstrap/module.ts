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

type SeedModule = {
  buildModulesWith: (
    entry: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  buildModulesTsWith: (
    entry: string,
    runtimeImport: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  compileGraphWith: (
    modules: BootstrapGraphModule[],
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic>;
  inferGraphTypesWith: (
    modules: BootstrapGraphModule[],
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic>;
  freshInferGraphState: () => BootstrapGraphInferState;
  inferGraphTypesFromWith: (
    state: BootstrapGraphInferState,
    modules: BootstrapGraphModule[],
    opts: BootstrapOptions,
  ) => BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic>;
  freshRecoveryGraphState: () => BootstrapRecoveryGraphState;
  recoverGraphFromWith: (
    state: BootstrapRecoveryGraphState,
    modules: BootstrapGraphModule[],
    opts: BootstrapOptions,
  ) => BootstrapRecoveryGraphState;
  compileGraphRecoveringWith: (
    modules: BootstrapGraphModule[],
    opts: BootstrapOptions,
  ) => BootstrapGraphRecovery;
  exportedOrigins: (stmts: unknown) => BootstrapExportOrigins;
  symbolOccurrences: (stmts: unknown) => BootstrapOccurrence[];
  emitDts: (src: string, runtimeImport: string) => BootstrapResult<string, BootstrapDiagnostic>;
  emitDtsForFileWith: (
    entry: string,
    runtimeImport: string,
    opts: BootstrapOptions,
  ) => BootstrapResult<string, BootstrapDiagnostic>;
};

/**
 * The knobs the self-hosted core takes: `open` selects open-world inference (a
 * file's own `"use open"` directive still wins), `runtime` inlines prelude
 * helpers, `docs` keeps `///` comments in the emitted text, and `moduleExt` is
 * the suffix rewritten onto relative import paths. Mirrors the non-plugin
 * `CompileOptions` in `../compile/compile.ts`.
 *
 * `strictEntry` is an editor policy rather than a compiler one: dependencies
 * always honour their own `"use open"`, but under it the graph entry takes
 * `open` verbatim, so a typo in a host-global-heavy file is still reported
 * (`../../dx/src/diagnostics.ts` does the same on its TypeScript path).
 */
export type BootstrapOptions = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
};

/** Strict inference, docstrings retained, `.js` siblings, directive in charge. */
export const defaultBootstrapOptions: BootstrapOptions = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
};

/** What editor queries use: the entry is judged strictly. */
export const editorBootstrapOptions: BootstrapOptions = {
  ...defaultBootstrapOptions,
  strictEntry: true,
};

/** A parsed graph module. `src` travels so each file's `"use open"` is visible. */
export type BootstrapGraphModule = { path: string; src: string; stmts: unknown };
export type BootstrapGraphRecovery = {
  outputs: BootstrapModuleOutput[];
  errors: BootstrapDiagnostic[];
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/module.bundle.cjs", import.meta.url)),
) as SeedModule;

export const buildModulesBootstrapWith = (
  entry: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  seed.buildModulesWith(entry, opts);

export const buildModulesBootstrap = (
  entry: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  buildModulesBootstrapWith(entry, defaultBootstrapOptions);

export const buildModulesTsBootstrapWith = (
  entry: string,
  runtimeImport: string,
  opts: BootstrapOptions,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  seed.buildModulesTsWith(entry, runtimeImport, opts);

export const buildModulesTsBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  buildModulesTsBootstrapWith(entry, runtimeImport, defaultBootstrapOptions);

export const compileGraphBootstrap = (
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapModuleOutput[], BootstrapDiagnostic> =>
  seed.compileGraphWith(modules, editorBootstrapOptions);

export const inferGraphTypesBootstrap = (
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapGraphInferOutput[], BootstrapDiagnostic> =>
  seed.inferGraphTypesWith(modules, defaultBootstrapOptions);

export const freshInferGraphStateBootstrap = (): BootstrapGraphInferState =>
  seed.freshInferGraphState();

export const inferGraphTypesFromBootstrap = (
  state: BootstrapGraphInferState,
  modules: BootstrapGraphModule[],
): BootstrapResult<BootstrapGraphInferState, BootstrapDiagnostic> =>
  seed.inferGraphTypesFromWith(state, modules, defaultBootstrapOptions);

export const freshRecoveryGraphStateBootstrap = (): BootstrapRecoveryGraphState =>
  seed.freshRecoveryGraphState();

export const recoverGraphFromBootstrap = (
  state: BootstrapRecoveryGraphState,
  modules: BootstrapGraphModule[],
): BootstrapRecoveryGraphState => seed.recoverGraphFromWith(state, modules, editorBootstrapOptions);

export const compileGraphBootstrapRecovering = (
  modules: BootstrapGraphModule[],
): BootstrapGraphRecovery => seed.compileGraphRecoveringWith(modules, editorBootstrapOptions);

export const exportedOriginsBootstrap = (stmts: unknown): BootstrapExportOrigins =>
  seed.exportedOrigins(stmts);

export const symbolOccurrencesBootstrap = (stmts: unknown): BootstrapOccurrence[] =>
  seed.symbolOccurrences(stmts);

/** `.d.ts` text for one source file, emitted by the frozen bootstrap graph. */
export const emitDtsBootstrap = (
  src: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic> => seed.emitDts(src, runtimeImport);

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
  seed.emitDtsForFileWith(entry, runtimeImport, opts);

export const emitDtsForFileBootstrap = (
  entry: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic> =>
  emitDtsForFileBootstrapWith(entry, runtimeImport, defaultBootstrapOptions);
