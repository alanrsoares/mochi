/**
 * re-reduced vendor plugin (ADR 0010 Gap A / Wave 6).
 *
 * Library-owned `HostExtension` — not language core. Recovers
 * `ContainerDef<S, R, …>` in `.d.mochi.ts` from `defineContainer` call AST so
 * TSX can import `.mochi` cast-free (kills hand `counter.ts` bridges).
 * Register via the project vendor-plugin list (`apps/docs/mochi.plugins.ts`).
 */
import { isErr, ok, type Result } from "@onrails/result";
import type { Expr } from "../../../src/ast";
import type { Diagnostic } from "../../../src/errors";
import type {
  DtsBindingHook,
  HostExtension,
  InferCallApi,
  InferCallHook,
} from "../../../src/extensions";
import type { Type } from "../../../src/types";
// Explicit extension: package boundary is resolved by Node/Vite without a bundler.
import { rExtend, tRecord, tString } from "../../../src/types.ts";

type CallExpr = Extract<Expr, { kind: "call" }>;
type RecordExpr = Extract<Expr, { kind: "record" }>;

const HOST = 'import("@re-reduced/preact")';

const isDefineContainerCall = (e: CallExpr): boolean =>
  e.fn.kind === "ref" && e.fn.name === "defineContainer" && e.args.length >= 2;

/** Flat literal state field → TS type string. Unknown shapes → `unknown`. */
const tsOfStateValue = (e: Expr): string => {
  if (e.kind === "num") return "number";
  if (e.kind === "bool") return "boolean";
  if (e.kind === "str") return "string";
  return "unknown";
};

const stateTs = (config: RecordExpr): string => {
  const stateField = config.fields.find((f) => f.name === "state");
  if (stateField?.value.kind !== "record") return "Record<string, unknown>";
  const fields = stateField.value.fields.map((f) => `${f.name}: ${tsOfStateValue(f.value)}`);
  return fields.length === 0 ? "Record<string, never>" : `{ ${fields.join("; ")} }`;
};

/**
 * `actions: on => { increment: on(s => …), … }` — first cut treats every action
 * as `ActionSpec<S, void>` (nullary creators). Payloadful actions deferred.
 */
const actionsTs = (config: RecordExpr, stateType: string): string => {
  const actionsField = config.fields.find((f) => f.name === "actions");
  if (!actionsField) return "Record<string, never>";
  let body: Expr = actionsField.value;
  if (body.kind === "lambda") body = body.body;
  if (body.kind !== "record" || body.fields.length === 0) return "Record<string, never>";
  const fields = body.fields.map((f) => `${f.name}: ${HOST}.ActionSpec<${stateType}, void>`);
  return `{ ${fields.join("; ")} }`;
};

const inferDefineContainer: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isDefineContainerCall(e)) return null;
  for (const arg of e.args) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  // Enough for hover; dts carries the honest ContainerDef.
  return ok(tRecord(rExtend("name", tString, api.freshRowVar())));
};

const reReducedDts: DtsBindingHook = (_name, _sc, value): string | null => {
  if (value.kind !== "call" || !isDefineContainerCall(value)) return null;
  const config = value.args[1];
  if (config?.kind !== "record") return null;
  const S = stateTs(config);
  const R = actionsTs(config, S);
  return `${HOST}.ContainerDef<${S}, ${R}, Record<string, never>, never> & { name: string }`;
};

export const reReducedExtension: HostExtension = {
  name: "re-reduced",
  inferCall: inferDefineContainer,
  dtsBinding: reReducedDts,
};
