/**
 * The `@mochi/compiler` barrel's compile and emit surfaces (ADR 0126, 0127):
 * thin adapters over `sync.ts` that take the barrel's options, apply its
 * defaults, and map seed diagnostics to `Diagnostic`.
 */
import { err, ok, type Result } from "@onrails/result";
import type { Diagnostic } from "../errors/errors";
import { diagnosticFromSeed } from "../errors/seed-diagnostic";
import type { BootstrapDiagnostic, BootstrapResult } from "./index.ts";
import type { BootstrapOptions, BootstrapPlugin } from "./options.ts";
import {
  type BootstrapTargets,
  compileBootstrapSyncWith,
  compileTargetsBootstrapSyncWith,
  compileTsBootstrapSyncWith,
  emitDtsBootstrapSyncWith,
} from "./sync.ts";

/** The module typed TS and `.d.ts` import runtime helpers from. */
export const DEFAULT_RUNTIME_IMPORT = "@mochi/runtime";

/** `runtime` (default on): inline the prelude builtins the program uses so the emitted module runs standalone. `docs` (default on) keeps `///` comments. `moduleExt` (default `.js`): suffix rewritten onto relative import paths — Vite uses `.mochi` so sibling modules re-enter the plugin. `plugins`: host plugins after the builtins; `[]` opts out of those too (ADR 0109). */
export type CompileOptions = {
  runtime?: boolean;
  docs?: boolean;
  moduleExt?: string;
  plugins?: readonly BootstrapPlugin[];
  /** Permit unbound host globals for this invocation; `"use open"` is per-file. */
  open?: boolean;
};

/** Typed-emit options: `runtimeImport` is the module helpers are imported from. */
export type EmitOptions = CompileOptions & { runtimeImport?: string };

/** One file's JS, typed TS and `.d.ts`, printed from one inference. */
export type CompileTargets = BootstrapTargets;

/** The barrel's options as the self-hosted core takes them, with the barrel's defaults. */
const toBootstrapOptions = (opts: CompileOptions): BootstrapOptions => ({
  open: opts.open ?? false,
  runtime: opts.runtime ?? true,
  docs: opts.docs ?? true,
  moduleExt: opts.moduleExt ?? ".js",
  strictEntry: false,
  plugins: opts.plugins,
});

const fromBootstrap = <T>(r: BootstrapResult<T, BootstrapDiagnostic[]>): Result<T, Diagnostic[]> =>
  r._tag === "Ok" ? ok(r.value) : err(r.error.map((error) => diagnosticFromSeed(error)));

/** Source → JS. */
export function compile(src: string, opts: CompileOptions = {}): Result<string, Diagnostic[]> {
  return fromBootstrap(compileBootstrapSyncWith(src, toBootstrapOptions(opts)));
}

/** Source → typed TypeScript (ADR 0026). */
export function codegenTs(src: string, opts: EmitOptions = {}): Result<string, Diagnostic[]> {
  return fromBootstrap(
    compileTsBootstrapSyncWith(
      src,
      opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT,
      toBootstrapOptions(opts),
    ),
  );
}

/** Source → `.d.ts`. Imports bind nothing; graphs use `emitDtsForFileBootstrapWith`. */
export function emitDts(src: string, opts: EmitOptions = {}): Result<string, Diagnostic[]> {
  return fromBootstrap(
    emitDtsBootstrapSyncWith(
      src,
      opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT,
      toBootstrapOptions(opts),
    ),
  );
}

/** Single-pass multi-target compile (ADR 0125): one inference → JS + typed TS + `.d.ts`. */
export function compileTargets(
  src: string,
  opts: EmitOptions = {},
): Result<CompileTargets, Diagnostic[]> {
  return fromBootstrap(
    compileTargetsBootstrapSyncWith(
      src,
      opts.runtimeImport ?? DEFAULT_RUNTIME_IMPORT,
      toBootstrapOptions(opts),
    ),
  );
}
