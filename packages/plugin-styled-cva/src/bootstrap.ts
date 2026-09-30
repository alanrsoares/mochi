/**
 * styled-cva typing over the self-hosted core (ADR 0009, 0057, 0109).
 * The `tw` extern stays opaque because its factories are overloaded; this
 * plugin derives a props → VNode type from each `tw.tag` call, preserves
 * variant keys as literal unions in declarations, reflows class strings, and
 * lists intrinsic factories for member completion.
 */
import type {
  BootstrapDtsBindingHook,
  BootstrapFormatHook,
  BootstrapInferCallHook,
  BootstrapPlugin,
  CompleteMemberHook,
} from "@mochi/compiler/bootstrap/options";
import type { Expr, Field, Span, St, Ty } from "@mochi/compiler/bootstrap/types";
import {
  freshRowVar,
  rExtend,
  tArrow,
  tCon,
  tLit,
  tRecord,
  tString,
  tUnion,
} from "@mochi/compiler/bootstrap/types";
import { INTRINSIC_ELEMENTS } from "@mochi/compiler/plugins/jsx-schema";

type CallExpr = Extract<Expr, { _tag: "ECall" }>;
type RecordExpr = Extract<Expr, { _tag: "ERecord" }>;

const none = { _tag: "None" } as const;

// Shared with the JSX schema so intrinsic validation and `tw.<tag>` cannot drift (ADR 0097).
const HTML_ELEMENTS = new Set(Object.keys(INTRINSIC_ELEMENTS));

/** The element name of a `tw.<tag>` callee, or `null` for any other callee. */
const twTag = (fn: Expr): string | null =>
  fn._tag === "EField" && fn.target._tag === "ERef" && fn.target.name === "tw" ? fn.name : null;

const fieldNamed = (r: RecordExpr, name: string): Field | undefined =>
  r.fields.find((f) => f.name === name);

const inferTwFactory: BootstrapInferCallHook = (fn, args, _origin, st0, api) => {
  const tag = twTag(fn);
  if (tag === null) return { _tag: "Ok", value: none };
  if (fn._tag !== "EField" || !HTML_ELEMENTS.has(tag))
    return {
      _tag: "Err",
      error: {
        message: `tw.${tag}: unknown HTML element '${tag}'`,
        start: fn.span.start,
        end: fn.span.end,
        help: none,
        suggestions: [],
      },
    };
  let st: St = st0;
  for (const arg of args) {
    const inferred = api.inferExpr(arg, st);
    if (inferred._tag === "Err") return inferred;
    st = inferred.value[1];
  }
  let [row, next] = freshRowVar(st);
  st = next;
  const config = args[1];
  const variants = config?._tag === "ERecord" ? fieldNamed(config, "variants")?.value : undefined;
  if (variants?._tag === "ERecord")
    for (const vf of variants.fields) {
      const keys: Ty[] =
        vf.value._tag === "ERecord" ? vf.value.fields.map((k) => tLit(k.name)) : [];
      row = rExtend(vf.name, keys.length > 0 ? tUnion(keys) : tString, row);
    }
  return {
    _tag: "Ok",
    value: { _tag: "Some", value: [tArrow(tRecord(row), tCon("VNode", [])), st] },
  };
};

/** `variants: { $tone: { rose: "…", … } }` → `$tone?: "rose" | …`. */
const variantPropFields = (config: RecordExpr): string[] => {
  const variants = fieldNamed(config, "variants")?.value;
  if (variants?._tag !== "ERecord") return [];
  return variants.fields.flatMap((vf) =>
    vf.value._tag === "ERecord" && vf.value.fields.length > 0
      ? [`${vf.name}?: ${vf.value.fields.map((k) => JSON.stringify(k.name)).join(" | ")}`]
      : [],
  );
};

const styledCvaDts: BootstrapDtsBindingHook = (_name, value) => {
  if (value._tag !== "ECall" || twTag(value.fn) === null) return null;
  const config = value.args[1];
  const props = [
    ...(config?._tag === "ERecord" ? variantPropFields(config) : []),
    "children?: unknown",
    "className?: string",
  ];
  // Open rest: host DOM attrs (onClick, type, aria-*) not modeled in Mochi.
  return `(props: { ${props.join("; ")} } & Record<string, unknown>) => any`;
};

// --- Class-string reflow (ADR 0057) ------------------------------------------
// Every break lands on a space kept at the head of the continuation, preserving
// the runtime class string while letting the formatter wrap at the shared width.

const WIDTH = 80;
const ARG_COL = 2;
const CHAIN_INDENT = 2;
const OP_LEN = "++ ".length;
const QUOTES = 2;

const isConcatCall = (e: Expr): e is CallExpr =>
  e._tag === "ECall" && e.fn._tag === "ERef" && e.fn.name === "concat" && e.args.length === 2;

/** Leaf values of a pure string-literal `++` spine, or null if any leaf is dynamic. */
const strLeaves = (e: Expr): string[] | null => {
  if (e._tag === "EStr") return [e.value];
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
    const cut = back > 0 ? back : rest.indexOf(" ", 1);
    if (cut <= 0) break;
    segs.push(rest.slice(0, cut));
    rest = rest.slice(cut);
    budget = Math.max(contBudget, 1);
  }
  segs.push(rest);
  return segs;
};

const strExpr = (value: string, span: Span): Expr => ({ _tag: "EStr", value, span });

const chainOf = (segs: string[], span: Span): Expr =>
  segs
    .map((value) => strExpr(value, span))
    .reduce((l, r) => ({
      _tag: "ECall",
      fn: { _tag: "ERef", name: "concat", span },
      args: [l, r],
      origin: none,
      span,
    }));

const exprSpan = (e: Expr): Span => e.span;

/** Canonical form of one class-string value, or null when already canonical. */
const reflowValue = (v: Expr, headBudget: number, contBudget: number): Expr | null => {
  const leaves = strLeaves(v);
  if (!leaves) return null;
  const full = leaves.join("");
  const segs = fillSegments(full, headBudget, contBudget);
  if (segs.length === leaves.length && segs.every((s, i) => s === leaves[i])) return null;
  return segs.length === 1 ? strExpr(full, exprSpan(v)) : chainOf(segs, exprSpan(v));
};

/** Reflow string fields inside the cva config record (variants live 2 deep). */
const reflowRecord = (r: RecordExpr, depth: number): RecordExpr | null => {
  let changed = false;
  const fields = r.fields.map((f) => {
    const next =
      f.value._tag === "ERecord"
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

const formatTwClassStrings: BootstrapFormatHook = (e) => {
  if (e._tag !== "ECall" || twTag(e.fn) === null) return null;
  let changed = false;
  const args = e.args.map((a, i) => {
    const next =
      i === 0
        ? reflowValue(
            a,
            WIDTH - ARG_COL - QUOTES,
            WIDTH - (ARG_COL + CHAIN_INDENT) - OP_LEN - QUOTES,
          )
        : a._tag === "ERecord"
          ? reflowRecord(a, 1)
          : null;
    if (!next) return a;
    changed = true;
    return next;
  });
  return changed ? { ...e, args } : null;
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

export const twMembers: CompleteMemberHook = ({ receiver }) =>
  receiver !== "tw"
    ? null
    : TW_TAGS.map((label) => ({
        label,
        kind: "member" as const,
        detail: "styled-cva factory",
      }));

export const styledCvaBootstrap: BootstrapPlugin = {
  name: "styled-cva",
  inferCall: inferTwFactory,
  format: formatTwClassStrings,
  dtsBinding: styledCvaDts,
  completeMembers: twMembers,
};
