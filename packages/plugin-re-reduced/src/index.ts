/**
 * re-reduced vendor plugin (ADR 0010 Gap A / Wave 6; Wave 10–11 shrink).
 *
 * Library-owned `HostExtension` — not language core. Infers the runtime
 * `{ name, ...config }` record structurally for `defineContainer`, derives a
 * structural Store sketch from `useContainer(def)` / `useSelect` for editor DX,
 * and wraps ContainerDef only at the outbound `.d.mochi.ts` seam.
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
import { rEmpty, rExtend, tArrow, tRecord, tString } from "../../../src/types.ts";

type CallExpr = Extract<Expr, { kind: "call" }>;

const HOST = 'import("@re-reduced/preact")';

/** Nullary host action stand-in — mochi `f()` peels nothing; `{}` is fine. */
const tAction = tRecord(rEmpty);

const isRefCall = (e: CallExpr, name: string): boolean => e.fn.kind === "ref" && e.fn.name === name;

const isDefineContainerCall = (e: CallExpr): boolean =>
  isRefCall(e, "defineContainer") && e.args.length >= 2;

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

/** Rebuild a row, mapping each field type (preserves order via reverse reduce). */
const mapRow = (row: Row, mapType: (t: Type) => Type): Row => {
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

/** `ReadSignal<T>` sketch — Counter reads `s.count.value`. */
const signalOf = (t: Type): Type => tRecord(rExtend("value", t, rEmpty));

const stateSignalsOf = (state: Type | null, api: InferCallApi): Type => {
  if (state?.kind === "record") return tRecord(mapRow(state.row, signalOf));
  return tRecord(api.freshRowVar());
};

/**
 * `actions: on => { increment: on(…), … }` — keep labels; values are nullary
 * creators (payloadful actions deferred).
 */
const actionsOf = (actions: Type | null): Type => {
  const result = actions?.kind === "arrow" ? actions.to : null;
  if (result?.kind !== "record") return tRecord(rEmpty);
  return tRecord(mapRow(result.row, () => tAction));
};

/** Structural Store sketch for hover + `store.` / `store.actions.` complete. */
const storeOf = (def: Type, api: InferCallApi): Type => {
  if (def.kind !== "record") {
    return tRecord(
      rExtend(
        "actions",
        tRecord(api.freshRowVar()),
        rExtend("$state", tRecord(api.freshRowVar()), rEmpty),
      ),
    );
  }
  const state = rowField(def.row, "state");
  const actions = rowField(def.row, "actions");
  return tRecord(
    rExtend(
      "actions",
      actionsOf(actions),
      rExtend("$state", stateSignalsOf(state, api), rExtend("$derived", tRecord(rEmpty), rEmpty)),
    ),
  );
};

const stateSignalsFromStore = (store: Type, api: InferCallApi): Type => {
  if (store.kind === "record") {
    const signals = rowField(store.row, "$state");
    if (signals) return signals;
  }
  return tRecord(api.freshRowVar());
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

const inferUseContainer: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, "useContainer") || e.args.length < 1) return null;
  const defR = api.infer(e.args[0]!);
  if (isErr(defR)) return defR;
  for (const arg of e.args.slice(1)) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(storeOf(api.zonk(defR.value), api));
};

/**
 * `useSelect(store, s => s.count.value)` — type the selector domain as
 * StateSignals from the store sketch (unary lambdas in dogfood).
 */
const inferUseSelect: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isRefCall(e, "useSelect") || e.args.length < 2) return null;
  const storeR = api.infer(e.args[0]!);
  if (isErr(storeR)) return storeR;
  const signals = stateSignalsFromStore(api.zonk(storeR.value), api);
  const result = api.freshVar();
  const selR = api.infer(e.args[1]!);
  if (isErr(selR)) return selR;
  const uni = api.unify(selR.value, tArrow(signals, result), e.args[1]!.span);
  if (isErr(uni)) return uni;
  for (const arg of e.args.slice(2)) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  return ok(result);
};

const inferReReducedCall: InferCallHook = (e, api) =>
  inferDefineContainer(e, api) ?? inferUseContainer(e, api) ?? inferUseSelect(e, api);

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
  inferCall: inferReReducedCall,
  dtsBinding: reReducedDts,
};
