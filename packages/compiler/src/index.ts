/**
 * Public barrel for `@mochi/compiler` (ADR 0048, 0127).
 * Compile / emit surfaces over the self-hosted core — DX lives in `@mochi/dx`.
 */
export {
  type CompileOptions,
  type CompileTargets,
  codegenTs,
  compile,
  compileTargets,
  DEFAULT_RUNTIME_IMPORT,
  type EmitOptions,
  emitDts,
} from "./compile/api.ts";
export { type Diagnostic, formatError } from "./errors/errors.ts";
export type { CompilerPlugin } from "./extensions/options.ts";
