/**
 * Public barrel for `@mochi/compiler` (ADR 0048).
 * Compile / typecheck / emit surfaces only — DX lives in `@mochi/dx`.
 */
export {
  type CompileOptions,
  type CompileTargets,
  codegenTs,
  compile,
  compileTargets,
  type Diagnostic,
  emitDts,
  formatError,
  type HostExtension,
  type ImportedContext,
  type LanguagePlugin,
  lex,
  type TypedProgram,
  type TypedProgramWithOptions,
  toTypedProgram,
  toTypedProgramRecovering,
  toTypedProgramWith,
} from "./compile/index.ts";
