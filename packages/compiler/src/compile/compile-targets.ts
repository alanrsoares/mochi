/**
 * Single-pass multi-target compile on the TypeScript core: one typed program →
 * JS + typed TS + `.d.ts`. The barrel's `compileTargets` runs the bootstrap twin
 * (`bootstrap/dts.mochi` `compileTargetsWith`, ADR 0125) and falls back here only
 * for a TypeScript-core plugin list.
 */
import { isErr, ok, type Result } from "@onrails/result";
import { codegen } from "../codegen/codegen";
import { DEFAULT_RUNTIME_IMPORT, emitTsModule } from "../codegen/codegen-ts";
import { emitDtsFromTyped } from "../dts/dts";
import type { Diagnostic } from "../errors/errors";
import { bindingTypeHooks, resolvePlugins } from "../extensions/extensions";
import { preludeNamespaces } from "../prelude/prelude";
import { type CompileOptions, toTypedProgram } from "./compile";

export type CompileTargets = {
  js: string;
  ts: string;
  dts: string;
};

export function compileTargetsWithTsCore(
  src: string,
  opts: CompileOptions = {},
): Result<CompileTargets, Diagnostic[]> {
  const typed = toTypedProgram(src, {
    open: opts.open,
    namespaces: preludeNamespaces,
    plugins: opts.plugins,
  });
  if (isErr(typed)) return typed;
  const { prog, res } = typed.value;
  const resolved = resolvePlugins(opts.plugins);
  const bindingHooks = bindingTypeHooks(resolved);

  const js = codegen(prog, undefined, {
    runtime: opts.runtime ?? true,
    docs: opts.docs,
    moduleExt: opts.moduleExt,
  });
  const ts = emitTsModule(prog, {
    env: res.env,
    aliases: res.aliases,
    types: res.types,
    letParams: res.letParams,
    importedKeys: new Map(),
    importLines: [],
    runtimeImport: DEFAULT_RUNTIME_IMPORT,
    bindingTypeHooks: bindingHooks,
    docs: opts.docs,
  });
  const dts = emitDtsFromTyped(prog, res, { plugins: opts.plugins, docs: opts.docs });
  return ok({ js, ts, dts });
}
