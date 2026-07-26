/**
 * re-reduced vendor plugin (ADR 0010 Gap A / Wave 6).
 *
 * Library-owned `HostExtension` — not language core. Infers the runtime
 * `{ name, ...config }` record structurally, then wraps that inferred shape in
 * `ContainerDef<S, R, …>` only at the outbound `.d.mochi.ts` seam.
 * Register via the project vendor-plugin list (`apps/docs/mochi.plugins.ts`).
 */
import { isErr, ok, type Result } from "@onrails/result";
import type { Expr } from "../../../src/ast";
import type { Diagnostic } from "../../../src/errors";
import type {
  DtsBindingApi,
  DtsBindingHook,
  HostExtension,
  InferCallApi,
  InferCallHook,
} from "../../../src/extensions";
import type { Row, Type } from "../../../src/types";
// Explicit extension: package boundary is resolved by Node/Vite without a bundler.
import { rExtend, tRecord, tString } from "../../../src/types.ts";

type CallExpr = Extract<Expr, { kind: "call" }>;

const HOST = 'import("@re-reduced/preact")';

const isDefineContainerCall = (e: CallExpr): boolean =>
  e.fn.kind === "ref" && e.fn.name === "defineContainer" && e.args.length >= 2;

const rowField = (row: Row, name: string): Type | null => {
  let current = row;
  while (current.kind === "extend") {
    if (current.label === name) return current.type;
    current = current.rest;
  }
  return null;
};

const rowLabels = (row: Row): string[] => {
  const labels: string[] = [];
  let current = row;
  while (current.kind === "extend") {
    labels.push(current.label);
    current = current.rest;
  }
  return labels;
};

const inferDefineContainer: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isDefineContainerCall(e)) return null;
  let configType: Type | null = null;
  for (const [index, arg] of e.args.entries()) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
    if (index === 1) configType = api.zonk(r.value);
  }
  // Runtime is exactly `{ name, ...config }`; keep that useful structural shape
  // in HM and reserve the heavy host generic for outbound TypeScript.
  if (configType?.kind === "record") {
    return ok(tRecord(rExtend("name", tString, configType.row)));
  }
  return ok(tRecord(rExtend("name", tString, api.freshRowVar())));
};

const reReducedDts: DtsBindingHook = (
  _name,
  _sc,
  value,
  _aliases,
  _fallback,
  api: DtsBindingApi,
): string | null => {
  if (value.kind !== "call" || !isDefineContainerCall(value)) return null;
  if (api.folded.kind !== "record") return null;
  const state = rowField(api.folded.row, "state");
  const actions = rowField(api.folded.row, "actions");
  const S = state ? api.tsType(state) : "Record<string, unknown>";
  const actionResult = actions?.kind === "arrow" ? actions.to : null;
  const actionNames = actionResult?.kind === "record" ? rowLabels(actionResult.row) : [];
  const R =
    actionNames.length === 0
      ? "Record<string, never>"
      : `{ ${actionNames.map((name) => `${name}: ${HOST}.ActionSpec<${S}, void>`).join("; ")} }`;
  return `${HOST}.ContainerDef<${S}, ${R}, Record<string, never>, never> & { name: string }`;
};

export const reReducedExtension: HostExtension = {
  name: "re-reduced",
  inferCall: inferDefineContainer,
  dtsBinding: reReducedDts,
};
