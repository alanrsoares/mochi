/**
 * styled-cva vendor plugin (ADR 0010 Gap B / Wave 3 #15+#17, Wave 4 #23).
 *
 * A library-owned `HostExtension` adapter — not language core. It lives outside
 * the compiler tree and depends only on the plugin interface (`HostExtension`,
 * `InferCallApi`) plus the type constructors it needs. Register it through the
 * project's vendor-plugin list (`apps/docs/mochi.plugins.ts`, #20). Teaches:
 * - `tw.tag(base)` / `tw.tag(base, { variants })` → props → VNode component
 * - dts: `$tone?: "rose" | …` unions extracted from the variants record AST
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
import type { Row, Type } from "../../../src/types";
import { rExtend, tArrow, tCon, tRecord, tString } from "../../../src/types";

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
