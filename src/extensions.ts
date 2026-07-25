/**
 * Host extension seams (ADR 0010).
 *
 * Core language (HM + universal JSX desugar) stays free of kit-specific
 * knowledge (`tw`, CVA, re-reduced, …). Hosts register small hooks so infer /
 * dts can specialize without forking the pipeline.
 *
 * Universal JSX (`h(tag, props, …)`) remains in core — only non-core host kits
 * belong behind these hooks.
 */

import type { Result } from "@onrails/result";
import type { Expr } from "./ast";
import type { Diagnostic } from "./errors";
import type { Scheme } from "./schemes";
import type { Span } from "./span";
import type { AliasDef, Row, Type } from "./types";

type CallExpr = Extract<Expr, { kind: "call" }>;

/** Capabilities a call-hook may use — mirrors the private infer Ctx without exporting it. */
export type InferCallApi = {
  infer: (e: Expr) => Result<Type, Diagnostic>;
  unify: (a: Type, b: Type, span?: Span) => Result<Type, Diagnostic>;
  freshVar: () => Type;
  freshRowVar: () => Row;
  zonk: (t: Type) => Type;
};

/**
 * Handle a call expression, or return `null` to fall through to the next hook /
 * core default. First non-null wins (registration order).
 */
export type InferCallHook = (e: CallExpr, api: InferCallApi) => Result<Type, Diagnostic> | null;

/**
 * Override a binding's `.d.ts` type string, or return `null` for the default
 * `bindingTsType` path. Used by styled-cva to emit `$tone` literal unions from
 * factory AST without modeling VariantProps in HM.
 */
export type DtsBindingHook = (
  name: string,
  sc: Scheme,
  value: Expr,
  aliases: AliasDef[],
  fallback: () => string,
) => string | null;

export type HostExtension = {
  name: string;
  inferCall?: InferCallHook;
  dtsBinding?: DtsBindingHook;
};

/** Run infer-call hooks in order; `null` from all → caller uses core default. */
export const runInferCallHooks = (
  hooks: InferCallHook[],
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  for (const hook of hooks) {
    const r = hook(e, api);
    if (r !== null) return r;
  }
  return null;
};

/** First dts binding hook that returns a string wins. */
export const runDtsBindingHooks = (
  hooks: DtsBindingHook[],
  name: string,
  sc: Scheme,
  value: Expr,
  aliases: AliasDef[],
  fallback: () => string,
): string => {
  for (const hook of hooks) {
    const r = hook(name, sc, value, aliases, fallback);
    if (r !== null) return r;
  }
  return fallback();
};
