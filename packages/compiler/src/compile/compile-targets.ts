/**
 * Single-pass multi-target compile: one typed program → JS + typed TS + `.d.ts`.
 * Playground previously ran `compile` + `codegenTs` + `emitDts` (three full
 * lex/parse/check/infer pipelines). This keeps the displayed surfaces in lockstep
 * at ~⅓ the cost.
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

export function compileTargets(
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
  });
  const dts = emitDtsFromTyped(prog, res, { plugins: opts.plugins });
  return ok({ js, ts, dts });
}
