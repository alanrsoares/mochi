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
export type { CallExpr, Expr, RecordExpr } from "../ast/ast";

// Local alias so the helpers below can use the narrowed shape without a
// value-level import cycle (`extensions.ts` type-imports from this module).
type CallExpr = Extract<Expr, { kind: "call" }>;
type RecordExprLocal = Extract<Expr, { kind: "record" }>;

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
 * One `b(args…)` or `b.method(args…)` application of a builder binder.
 *
 * `method` is `null` for a direct application (`on(reducer)`) and the member
 * name for a method call (`fx.onChange(select, run)`).
 */
export type BuilderSite = {
  readonly method: string | null;
  readonly args: readonly Expr[];
  readonly call: CallExpr;
};

/** A builder site plus its record label, when the body is a record literal. */
export type LabelledSite = { readonly label: string | null; readonly site: BuilderSite };

/**
 * A builder lambda's body, decomposed into independent applications.
 *
 * `shape` says how the sites were laid out: `"record"` for `b => { k: b(…) }`
 * (each site labelled), `"seq"` for `b => [b.m(…), …]`, `"single"` for
 * `b => b.m(…)`.
 */
export type BuilderBody = {
  readonly binder: string;
  readonly shape: "record" | "seq" | "single";
  readonly sites: readonly LabelledSite[];
};

const siteOf = (e: Expr, binder: string): BuilderSite | null => {
  if (e.kind !== "call") return null;
  if (e.fn.kind === "ref" && e.fn.name === binder) return { method: null, args: e.args, call: e };
  if (e.fn.kind === "field" && e.fn.target.kind === "ref" && e.fn.target.name === binder) {
    return { method: e.fn.name, args: e.args, call: e };
  }
  return null;
};

/**
 * Decompose a *builder lambda* — `b => …` whose body is made of `b(…)` /
 * `b.m(…)` applications — so a plugin can type each application on its own.
 *
 * This is the plugin-kit answer to **rank-2 builders**: a config DSL passes in
 * a polymorphic builder (`defineContainer`'s `on`, its `fx`), but HM makes a
 * lambda parameter monomorphic, so inferring `b => …` as a whole forces every
 * call site to share one instantiation — two actions cannot carry different
 * payloads, two `onChange`s cannot watch different types. A plugin that walks
 * the sites instead never unifies `b` at all and is free to instantiate each
 * site separately, which is what the host library's generic signature means.
 *
 * Returns `null` unless the lambda takes exactly one named parameter and
 * *every* slot of its body is such an application — so a caller can fall back
 * to ordinary inference on anything it does not recognize.
 */
export const builderBody = (e: Expr): BuilderBody | null => {
  if (e.kind !== "lambda" || e.params.length !== 1) return null;
  const param = e.params[0]!;
  if (param.kind !== "name") return null;
  const binder = param.name;
  const body = e.body;
  if (body.kind === "record" && !body.spread) {
    const sites: LabelledSite[] = [];
    for (const f of body.fields) {
      const site = siteOf(f.value, binder);
      if (!site) return null;
      sites.push({ label: f.name, site });
    }
    return { binder, shape: "record", sites };
  }
  if (body.kind === "arr") {
    const sites: LabelledSite[] = [];
    for (const el of body.elements) {
      if (el.kind !== "expr") return null;
      const site = siteOf(el.expr, binder);
      if (!site) return null;
      sites.push({ label: null, site });
    }
    return { binder, shape: "seq", sites };
  }
  const single = siteOf(body, binder);
  if (single) return { binder, shape: "single", sites: [{ label: null, site: single }] };
  return null;
};

/** The value expression of `label` in a record literal; `null` when absent. */
export const fieldExpr = (record: RecordExprLocal, label: string): Expr | null =>
  record.fields.find((f) => f.name === label)?.value ?? null;

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
