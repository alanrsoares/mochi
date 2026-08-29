/**
 * Labeled-parameter sugar (ADR 0098 §2): a trailing `~name` group is one
 * record parameter, not a second HM calling convention.
 */
import type { LabeledParam, LamParam } from "./ast";
import type { Span } from "./span";

export type { LabeledParam };

export type SplitParams = { pos: LamParam[]; labs: LabeledParam[] };

/** Split a lambda's params into positionals and a trailing labeled group. */
export const splitLamParams = (params: readonly LamParam[]): SplitParams => {
  const pos: LamParam[] = [];
  const labs: LabeledParam[] = [];
  for (const p of params) {
    if (p.kind === "labeled") labs.push(p);
    else pos.push(p);
  }
  return { pos, labs };
};

/** True when every labeled param (if any) sits after every positional. */
export const labeledIsTrailing = (params: readonly LamParam[]): boolean => {
  let seen = false;
  for (const p of params) {
    if (p.kind === "labeled") seen = true;
    else if (seen) return false;
  }
  return true;
};

/** The field is omittable at the call site (written `?` and/or given a default). */
export const labeledFieldOmittable = (p: LabeledParam): boolean =>
  p.optional || p.default !== undefined;

/** JS / `.d.ts` parameter list: a labeled suffix collapses to one `$lab`. */
export const jsLamParams = (params: readonly LamParam[]): LamParam[] => {
  const { pos, labs } = splitLamParams(params);
  if (labs.length === 0) return pos;
  const span: Span = labs[0]!.span;
  return [...pos, { kind: "name", name: "$lab", span }];
};

/** How many JS arguments a lambda's params occupy (`_curry` arity). */
export const jsParamCount = (params: readonly LamParam[]): number => jsLamParams(params).length;
