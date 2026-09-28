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

// Explicit real-file subpath (like `@mochi/compiler/types` below): a value
// import, so Node/Vite's config loader must resolve it without a bundler.
import type { Expr } from "@mochi/compiler/ast";
import type { Diagnostic } from "@mochi/compiler/errors";
import type {
  CompleteMemberHook,
  DtsBindingHook,
  InferCallApi,
  InferCallHook,
  LanguagePlugin,
} from "@mochi/compiler/extensions";
import type { CallExpr, RecordExpr } from "@mochi/compiler/plugin-kit";
import { inferArgs } from "@mochi/compiler/plugin-kit";
// Explicit extension: crossing the package boundary, this specifier is resolved
// by Node/Vite's config loader without a bundler, which needs the real filename.
import { INTRINSIC_ELEMENTS } from "@mochi/compiler/plugins/jsx-schema";
import type { Row, Type } from "@mochi/compiler/types";
import { rExtend, tArrow, tCon, tLit, tRecord, tUnion } from "@mochi/compiler/types";
import { err, isErr, ok, type Result } from "@onrails/result";

const isTwFactoryCall = (e: CallExpr): boolean =>
  e.fn.kind === "field" && e.fn.target.kind === "ref" && e.fn.target.name === "tw";

// Intrinsic tags `tw.<member>` may address. Shared with the JSX schema (ADR
// 0097) rather than kept as a third copy of the element list: `tw` is a runtime
// proxy that would happily render an unknown element, and the two lists drifting
// is exactly how `<dl>` ended up rejected by JSX while `tw.dl` stayed legal.
// SVG tags come along for free, which styled SVG wants anyway.
const HTML_ELEMENTS = new Set(Object.keys(INTRINSIC_ELEMENTS));

const inferTwFactory: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isTwFactoryCall(e)) return null;
  const tag = e.fn.kind === "field" ? e.fn.name : "";
  if (!HTML_ELEMENTS.has(tag)) {
    return err({
      kind: "type",
      message: `tw.${tag}: unknown HTML element '${tag}'`,
      span: e.fn.span,
    });
  }
  const argsR = inferArgs(e.args, api);
  if (isErr(argsR)) return argsR;
  let row: Row = api.freshRowVar();
  const variantsArg = e.args[1];
  if (variantsArg?.kind === "record") {
    const variantsField = variantsArg.fields.find((f) => f.name === "variants");
    if (variantsField?.value.kind === "record") {
      for (const vf of variantsField.value.fields) {
        const keys = vf.value.kind === "record" ? vf.value.fields.map((k) => tLit(k.name)) : [];
        row = rExtend(vf.name, keys.length > 0 ? tUnion(keys) : tCon("string"), row);
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

/**
 * HTML element factories `tw.div` / `tw.button` / … — opaque `extern tw : a`
 * carries no member list in HM (ADR 0009); completion is a plugin hook (ADR 0013).
 */
const TW_TAGS = [
  "a",
  "article",
  "aside",
  "button",
  "div",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "header",
  "img",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "p",
  "section",
  "span",
  "ul",
] as const;

const twMembers: CompleteMemberHook = ({ receiver }) =>
  receiver !== "tw"
    ? null
    : TW_TAGS.map((label) => ({
        label,
        kind: "member" as const,
        detail: "styled-cva factory",
      }));

export const styledCvaExtension: LanguagePlugin = {
  name: "styled-cva",
  // Claim: calls whose callee is a field off the `tw` extern (`tw.div(...)`).
  inferCall: { memberTargets: ["tw"], hook: inferTwFactory },
  dtsBinding: styledCvaDts,
  completeMembers: twMembers,
};
