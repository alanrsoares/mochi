/**
 * styled-cva host extension (ADR 0010 Gap B / Wave 3 #15+#17).
 *
 * Not language core — register via `InferOptions.extensions` /
 * `emitDts(..., { extensions })`. Teaches:
 * - `tw.tag(base)` / `tw.tag(base, { variants })` → props → VNode component
 * - dts: `$tone?: "rose" | …` unions extracted from the variants record AST
 */
import { isErr, ok, type Result } from "@onrails/result";
import type { Expr } from "../ast";
import type { Diagnostic } from "../errors";
import type { DtsBindingHook, HostExtension, InferCallApi, InferCallHook } from "../extensions";
import type { Row, Type } from "../types";
import { rExtend, tArrow, tCon, tRecord, tString } from "../types";

type CallExpr = Extract<Expr, { kind: "call" }>;
type RecordExpr = Extract<Expr, { kind: "record" }>;

const isTwFactoryCall = (e: CallExpr): boolean =>
  e.fn.kind === "field" && e.fn.target.kind === "ref" && e.fn.target.name === "tw";

const inferTwFactory: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isTwFactoryCall(e)) return null;
  for (const arg of e.args) {
    const r = api.infer(arg);
    if (isErr(r)) return r;
  }
  let row: Row = api.freshRowVar();
  const variantsArg = e.args[1];
  if (variantsArg?.kind === "record") {
    const variantsField = variantsArg.fields.find((f) => f.name === "variants");
    if (variantsField?.value.kind === "record") {
      for (const vf of variantsField.value.fields) {
        row = rExtend(vf.name, tString, row);
      }
    }
  }
  return ok(tArrow(tRecord(row), tCon("VNode")));
};

/** Collect `variants: { $tone: { rose: "…", … } }` → `$tone?: "rose" | …`. */
const variantPropFields = (config: RecordExpr): string[] => {
  const variantsField = config.fields.find((f) => f.name === "variants");
  if (variantsField?.value.kind !== "record") return [];
  const out: string[] = [];
  for (const vf of variantsField.value.fields) {
    if (vf.value.kind !== "record" || vf.value.fields.length === 0) continue;
    const lits = vf.value.fields.map((k) => JSON.stringify(k.name));
    out.push(`${vf.name}?: ${lits.join(" | ")}`);
  }
  return out;
};

const styledCvaDts: DtsBindingHook = (_name, _sc, value): string | null => {
  if (value.kind !== "call" || !isTwFactoryCall(value)) return null;
  const props: string[] = [];
  const config = value.args[1];
  if (config?.kind === "record") props.push(...variantPropFields(config));
  props.push("children?: unknown", "className?: string");
  // Open rest: host DOM attrs (onClick, type, aria-*) not modeled in Mochi.
  return `(props: { ${props.join("; ")} } & Record<string, unknown>) => any`;
};

export const styledCvaExtension: HostExtension = {
  name: "styled-cva",
  inferCall: inferTwFactory,
  dtsBinding: styledCvaDts,
};

/** Flatten registered extensions into hook arrays (registration order). */
export const collectInferCallHooks = (exts: HostExtension[] | undefined): InferCallHook[] =>
  (exts ?? []).flatMap((e) => (e.inferCall ? [e.inferCall] : []));

export const collectDtsBindingHooks = (exts: HostExtension[] | undefined): DtsBindingHook[] =>
  (exts ?? []).flatMap((e) => (e.dtsBinding ? [e.dtsBinding] : []));
