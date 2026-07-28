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
  FormatHook,
  InferCallApi,
  InferCallHook,
  LanguagePlugin,
} from "@mochi/compiler/extensions";
import type { CallExpr, RecordExpr } from "@mochi/compiler/plugin-kit";
import { inferArgs } from "@mochi/compiler/plugin-kit";
import type { Span } from "@mochi/compiler/span";
import type { Row, Type } from "@mochi/compiler/types";
// Explicit extension: crossing the package boundary, this specifier is resolved
// by Node/Vite's config loader without a bundler, which needs the real filename.
import { rExtend, tArrow, tCon, tLit, tRecord, tUnion } from "@mochi/compiler/types";
import { err, isErr, ok, type Result } from "@onrails/result";

const isTwFactoryCall = (e: CallExpr): boolean =>
  e.fn.kind === "field" && e.fn.target.kind === "ref" && e.fn.target.name === "tw";

// All current HTML elements (WHATWG living standard). `tw.<member>` factories
// address intrinsic tags, so a member outside this set is a typo — `tw` is a
// runtime proxy that would happily render an unknown element.
const HTML_ELEMENTS = new Set([
  ...(
    "a abbr address area article aside audio b base bdi bdo blockquote body br " +
    "button canvas caption cite code col colgroup data datalist dd del details dfn " +
    "dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 " +
    "h6 head header hgroup hr html i iframe img input ins kbd label legend li link " +
    "main map mark menu meta meter nav noscript object ol optgroup option output p " +
    "picture pre progress q rp rt ruby s samp script search section select slot " +
    "small source span strong style sub summary sup table tbody td template textarea " +
    "tfoot th thead time title tr track u ul var video wbr"
  ).split(" "),
]);

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

// --- Class-string reflow (ADR 0057) -----------------------------------------
//
// A tw factory's class strings are space-separated lists, so the formatter may
// re-flow them: over-width strings split into a `++` chain (one segment per
// line), and an existing pure-string chain re-fills canonically. Segments are
// chosen so their concatenation is byte-identical to the source string — every
// break lands on a space, and the space stays *visible* at the head of the
// continuation (`"…colors" ++ " hover:…"`); dropping it would fuse two class
// names into one. The hook rewrites the AST and delegates layout to the core
// printer via `api.exprD`, so the emitted `++` chain is laid out by the same
// `concatD` path as hand-written chains (and the hook, re-entered on its own
// output, finds it already canonical and returns null — a fixed point).
//
// Budgets mirror the formatter's canonical layout (WIDTH 80, ADR 0025): a call
// argument sits at column 2, chain continuations at column 4 behind `++ `, and
// a record field spends 2 more columns per nesting level plus its own name.

const WIDTH = 80;
const ARG_COL = 2;
const CHAIN_INDENT = 2;
const OP_LEN = "++ ".length;
const QUOTES = 2;

const isConcatCall = (e: Expr): e is CallExpr =>
  e.kind === "call" && e.fn.kind === "ref" && e.fn.name === "concat" && e.args.length === 2;

/** Leaf values of a pure string-literal `++` spine, or null if any leaf is dynamic. */
const strLeaves = (e: Expr): string[] | null => {
  if (e.kind === "str") return [e.value];
  if (!isConcatCall(e)) return null;
  const l = strLeaves(e.args[0]!);
  const r = strLeaves(e.args[1]!);
  return l && r ? [...l, ...r] : null;
};

/** Greedy fill: split only at spaces; the space leads the next segment. */
const fillSegments = (full: string, headBudget: number, contBudget: number): string[] => {
  const segs: string[] = [];
  let rest = full;
  let budget = Math.max(headBudget, 1);
  while (rest.length > budget) {
    const back = rest.lastIndexOf(" ", budget);
    // An oversize token breaks at the next space instead (never mid-token).
    const cut = back > 0 ? back : rest.indexOf(" ", 1);
    if (cut <= 0) break;
    segs.push(rest.slice(0, cut));
    rest = rest.slice(cut);
    budget = Math.max(contBudget, 1);
  }
  segs.push(rest);
  return segs;
};

const chainOf = (segs: string[], span: Span): Expr =>
  segs
    .map((value): Expr => ({ kind: "str", value, span }))
    .reduce((l, r) => ({
      kind: "call",
      fn: { kind: "ref", name: "concat", span },
      args: [l, r],
      span,
    }));

/** Canonical form of one class-string value, or null when already canonical. */
const reflowValue = (v: Expr, headBudget: number, contBudget: number): Expr | null => {
  const leaves = strLeaves(v);
  if (!leaves) return null;
  const full = leaves.join("");
  const segs = fillSegments(full, headBudget, contBudget);
  if (segs.length === leaves.length && segs.every((s, i) => s === leaves[i])) return null;
  return segs.length === 1 ? { kind: "str", value: full, span: v.span } : chainOf(segs, v.span);
};

/** Reflow string fields inside the cva config record (variants live 2 deep). */
const reflowRecord = (r: RecordExpr, depth: number): RecordExpr | null => {
  let changed = false;
  const fields = r.fields.map((f) => {
    const next =
      f.value.kind === "record"
        ? reflowRecord(f.value, depth + 1)
        : reflowValue(
            f.value,
            WIDTH - (ARG_COL + 2 * depth) - (f.name.length + 2) - QUOTES,
            WIDTH - (ARG_COL + 2 * depth + CHAIN_INDENT) - OP_LEN - QUOTES,
          );
    if (!next) return f;
    changed = true;
    return { ...f, value: next };
  });
  return changed ? { ...r, fields } : null;
};

const formatTwClassStrings: FormatHook = (e, api) => {
  if (e.kind !== "call" || !isTwFactoryCall(e)) return null;
  let changed = false;
  const args = e.args.map((a, i) => {
    const next =
      i === 0
        ? reflowValue(
            a,
            WIDTH - ARG_COL - QUOTES,
            WIDTH - (ARG_COL + CHAIN_INDENT) - OP_LEN - QUOTES,
          )
        : a.kind === "record"
          ? reflowRecord(a, 1)
          : null;
    if (!next) return a;
    changed = true;
    return next;
  });
  return !changed ? null : api.exprD({ ...e, args });
};

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
  format: formatTwClassStrings,
  dtsBinding: styledCvaDts,
  completeMembers: twMembers,
};
