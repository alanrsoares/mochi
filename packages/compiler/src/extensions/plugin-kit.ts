/**
 * Plugin kit — shared infrastructure for `LanguagePlugin` implementations.
 *
 * Every plugin (builtin `jsxPlugin`, vendor `@mochi/plugin-styled-cva` /
 * `-preact` / `-re-reduced`) kept privately re-deriving the same small
 * helpers: call/record AST narrowings, the callee-name predicate, row
 * walkers, and the "infer every arg, short-circuit the first Err" loop.
 * They live here once, exported via `@mochi/compiler/extensions` alongside
 * the hook types, and via `@mochi/compiler/plugin-kit` for value imports
 * from vendor packages: like `@mochi/compiler/types`, that subpath maps to
 * this real filename (and the value import below carries its `.ts`
 * extension) so Node/Vite's config loader resolves it without a bundler.
 * Behavior-neutral: each helper is byte-for-byte the logic the plugins
 * already ran.
 */

import { isErr, ok, type Result } from "@onrails/result";
import type { Expr } from "../ast/ast";
// Explicit extension: Node's type-stripping loader (vendor `mochi.plugins.*`
// manifests) resolves this file directly and cannot resolve extensionless
// relative specifiers. `types.ts` is import-free, so the chain ends there.
import { type Row, rEmpty, rExtend, type Type } from "../ast/types.ts";
import type { Diagnostic } from "../errors/errors";
import type { InferCallApi } from "./extensions";

/** Narrowed `Expr` shapes every call-hook works over (re-exported from `ast`). */
export type { CallExpr, RecordExpr } from "../ast/ast";

// Local alias so the helpers below can use the narrowed shape without a
// value-level import cycle (`extensions.ts` type-imports from this module).
type CallExpr = Extract<Expr, { kind: "call" }>;

/** `name(args…)` — the callee is a plain `ref` to exactly `name`. */
export const isRefCall = (e: CallExpr, name: string): boolean =>
  e.fn.kind === "ref" && e.fn.name === name;

/** Walk a row for `label`; open tails / missing labels → `null`. */
export const rowField = (row: Row, label: string): Type | null => {
  let current = row;
  while (current.kind === "extend") {
    if (current.label === label) return current.type;
    current = current.rest;
  }
  return null;
};

/** The labels of a row's explicit fields, in row order (open tail ignored). */
export const rowLabels = (row: Row): string[] => {
  const labels: string[] = [];
  let current = row;
  while (current.kind === "extend") {
    labels.push(current.label);
    current = current.rest;
  }
  return labels;
};

/** Rebuild a row, mapping each field type (preserves order via reverse reduce). */
export const mapRow = (row: Row, mapType: (t: Type) => Type): Row => {
  const fields: { label: string; type: Type }[] = [];
  let current = row;
  while (current.kind === "extend") {
    fields.push({ label: current.label, type: current.type });
    current = current.rest;
  }
  let out: Row = current.kind === "rvar" ? current : rEmpty;
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i]!;
    out = rExtend(f.label, mapType(f.type), out);
  }
  return out;
};

/**
 * Infer every expression in order, short-circuiting on the first `Err` —
 * the loop each call-hook ran by hand over `e.args` (or an `args.slice(…)`
 * tail). `Ok` carries the raw inferred types positionally; callers `zonk`
 * the ones they inspect.
 */
export const inferArgs = (args: readonly Expr[], api: InferCallApi): Result<Type[], Diagnostic> => {
  const types: Type[] = [];
  for (const arg of args) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
    types.push(r.value);
  }
  return ok(types);
};
