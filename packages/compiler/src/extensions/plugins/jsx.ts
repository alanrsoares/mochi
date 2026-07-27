/**
 * Builtin JSX plugin (ADR 0011 decision 2, #27–#28) — the language's own most
 * complex piece of sugar, expressed as a `LanguagePlugin` instead of seams in
 * four core passes. All of JSX lives here:
 *
 * - `parse`: `<tag …>…</tag>` / `<>…</>` → `h(tag, props, children)`, tagged
 *   `origin: "jsx"` (ADR 0011 §5) — the provenance every hook below keys off, so
 *   a hand-written `h(...)` is never mistaken for sugar.
 * - `inferCall`: a component tag (record → …) has its prop row checked against
 *   the attrs; anything else is an intrinsic tag and yields `VNode`.
 * - `format`: re-fold that call back to `<tag …>…</tag>` / `<>…</>`.
 * - `bindingType`: a component binding declares as `(props: P) => any` for both
 *   the `.d.ts` writer and the TS backend (ADR 0010 #17).
 *
 * `VNode` is this plugin's vocabulary, not the prelude's: no declaration
 * anywhere, just a bare `tCon("VNode")` invented here and rendered nominally by
 * `showType` / `tsOf` like any other unknown constructor.
 *
 * The lexer stays generic: `<`, `>`, `/`, strings and identifiers are plain
 * tokens, and the grammar that gives them JSX meaning is entirely below.
 */
import { isErr, ok, type Result } from "@onrails/result";
import { type Expr, type Field, isCtorName, type RecordExpr, type SeqElem } from "../../ast/ast";
import { type Span, spanning } from "../../ast/span";
import { type Row, type Type, tCon } from "../../ast/types";
import { cat, type Doc, group, indent, line, seq, softline, txt } from "../../doc/doc";
import type { Diagnostic } from "../../errors/errors";
import type {
  BindingTypeApi,
  BindingTypeHook,
  FormatApi,
  FormatHook,
  InferCallApi,
  InferCallHook,
  LanguagePlugin,
  ParseHook,
  ParserApi,
} from "../extensions";
import { type CallExpr, rowField } from "../plugin-kit";

/** The JSX pragma name the parser desugars to, and the fragment tag it uses for `<>…</>`. */
const PRAGMA = "h";
const FRAGMENT = "Fragment";

/** Parser-synthesized `h(tag, props, …children)` (ADR 0011 §5 sugar provenance). */
const isJsxCall = (e: CallExpr): boolean => e.origin === "jsx" && e.args.length >= 2;

// ---------------------------------------------------------------- parse

/**
 * `h(tag, props, children)` with sugar provenance — the one place `origin:
 * "jsx"` is written, and the shape `formatJsx` / `inferJsxCall` below expect.
 */
const makeJsxCall = (
  api: ParserApi,
  tagExpr: Expr,
  fields: Field[],
  spreadExpr: Expr | undefined,
  children: SeqElem[],
  startSpan: Span,
): Expr => {
  const fullSpan = api.spanFrom(startSpan);
  return {
    kind: "call",
    fn: { kind: "ref", name: PRAGMA, span: startSpan },
    args: [
      tagExpr,
      { kind: "record", fields, spread: spreadExpr, span: fullSpan },
      { kind: "arr", elements: children, span: fullSpan },
    ],
    origin: "jsx",
    span: fullSpan,
  };
};

/**
 * Children up to the closing tag. `expectedTag` is the open tag's name (null for
 * a fragment), so a mismatch names both sides. Bare text/number/bool/identifier
 * children become literals; `{…}` re-enters the core expression parser.
 */
const parseJsxChildren = (api: ParserApi, expectedTag: string | null): SeqElem[] => {
  const elems: SeqElem[] = [];

  for (;;) {
    const tk = api.peek();
    if (tk.t === "eof") {
      api.fail(expectedTag ? `unclosed JSX tag '<${expectedTag}>'` : "unclosed JSX fragment");
    }

    if (tk.t === "lt" && api.peek(1).t === "slash") {
      api.next(); // consume '<'
      api.next(); // consume '/'

      if (expectedTag === null) {
        api.expect("gt");
        break;
      }

      const closingId = api.expectId();
      if (closingId.name !== expectedTag && !expectedTag.endsWith(`.${closingId.name}`)) {
        api.fail(
          `mismatched JSX closing tag: expected '</${expectedTag}>', got '</${closingId.name}>'`,
        );
      }
      api.expect("gt");
      break;
    }

    if (tk.t === "lt") {
      elems.push({ kind: "expr", expr: parseJsxElement(api) });
      continue;
    }

    if (tk.t === "lbrace") {
      api.next(); // consume '{'
      if (api.peek().t === "spread") {
        api.next(); // consume '...'
        const spreadChild = api.parseExpr();
        api.expect("rbrace");
        elems.push({ kind: "spread", expr: spreadChild });
      } else {
        const childExpr = api.parseExpr();
        api.expect("rbrace");
        elems.push({ kind: "expr", expr: childExpr });
      }
      continue;
    }

    const childTk = api.next();
    if (childTk.t === "str") {
      elems.push({ kind: "expr", expr: { kind: "str", value: childTk.v, span: childTk.span } });
    } else if (childTk.t === "num") {
      elems.push({
        kind: "expr",
        expr: { kind: "num", value: childTk.v, raw: childTk.raw, span: childTk.span },
      });
    } else if (childTk.t === "bool") {
      elems.push({ kind: "expr", expr: { kind: "bool", value: childTk.v, span: childTk.span } });
    } else if (childTk.t === "id") {
      elems.push({ kind: "expr", expr: { kind: "str", value: childTk.v, span: childTk.span } });
    } else {
      api.fail(`unexpected token in JSX children: ${childTk.t}`);
    }
  }

  return elems;
};

/**
 * One element, from its `<` through its close: fragment `<>…</>`, self-closing
 * `<tag />`, or `<tag …>children</tag>`. A lowercase tag is an intrinsic (string)
 * tag; a capitalized or dotted one (`<Foo.Bar />`) stays a reference expression.
 */
const parseJsxElement = (api: ParserApi): Expr => {
  const startTok = api.expect("lt");

  // Fragment `<> … </>`
  if (api.peek().t === "gt") {
    api.next(); // consume '>'
    const children = parseJsxChildren(api, null);
    return makeJsxCall(
      api,
      { kind: "str", value: FRAGMENT, span: startTok.span },
      [],
      undefined,
      children,
      startTok.span,
    );
  }

  const firstId = api.expectId();
  let tagRef: Expr = { kind: "ref", name: firstId.name, span: firstId.span };
  while (api.peek().t === "dot") {
    api.next(); // consume '.'
    const fieldId = api.expectId();
    tagRef = {
      kind: "field",
      target: tagRef,
      name: fieldId.name,
      span: spanning(tagRef.span, fieldId.span),
    };
  }

  // Lowercase → intrinsic string tag; capitalized or dotted → the reference itself.
  const tagNameStr = tagRef.kind === "ref" ? tagRef.name : null;
  const tagExpr: Expr =
    tagRef.kind === "ref" && !isCtorName(tagRef.name)
      ? { kind: "str", value: tagRef.name, span: tagRef.span }
      : tagRef;

  const fields: Field[] = [];
  let spreadExpr: Expr | undefined;
  while (api.peek().t !== "gt" && !(api.peek().t === "slash" && api.peek(1).t === "gt")) {
    if (api.peek().t === "lbrace") {
      api.next(); // consume '{'
      api.expect("spread");
      spreadExpr = api.parseExpr();
      api.expect("rbrace");
      continue;
    }
    const attrId = api.expectLabel();
    let valExpr: Expr = { kind: "bool", value: true, span: attrId.span };
    if (api.peek().t === "eq") {
      api.next(); // consume '='
      if (api.peek().t === "str") {
        const strTk = api.expect("str");
        valExpr = { kind: "str", value: strTk.v, span: strTk.span };
      } else if (api.peek().t === "lbrace") {
        api.next(); // consume '{'
        valExpr = api.parseExpr();
        api.expect("rbrace");
      } else {
        api.fail(`expected string or '{expr}' for attribute '${attrId.name}'`);
      }
    }
    fields.push({ name: attrId.name, nameSpan: attrId.span, value: valExpr });
  }

  if (api.peek().t === "slash") {
    api.next(); // consume '/'
    api.expect("gt");
    return makeJsxCall(api, tagExpr, fields, spreadExpr, [], startTok.span);
  }

  api.expect("gt"); // close the opening tag
  const children = parseJsxChildren(api, tagNameStr);
  return makeJsxCall(api, tagExpr, fields, spreadExpr, children, startTok.span);
};

/** Claim atom position only for a leading `<`; anything else falls through untouched. */
const parseJsxAtom: ParseHook = (api: ParserApi): Expr | null =>
  api.peek().t === "lt" ? parseJsxElement(api) : null;

// ---------------------------------------------------------------- infer

/**
 * Infer `h(tag, props, childrenArr)`. Component tags (arrow from record) check
 * attrs; string tags stay open-world on props.
 *
 * Children are a heterogeneous array (text + elements). Do **not** run normal
 * Array inference (that forces one element type) — infer each child for errors
 * only, then type the slot as `[VNode]` for the call.
 */
const inferJsxCall: InferCallHook = (
  e: CallExpr,
  api: InferCallApi,
): Result<Type, Diagnostic> | null => {
  if (!isJsxCall(e)) return null;
  const tagExpr = e.args[0]!;
  const propsExpr = e.args[1]!;
  const tagT = api.infer(tagExpr);
  if (isErr(tagT)) return tagT;
  const propsT = api.infer(propsExpr);
  if (isErr(propsT)) return propsT;

  const childrenExpr = e.args[2];
  if (childrenExpr?.kind === "arr") {
    for (const el of childrenExpr.elements) {
      const childT = api.infer(el.expr);
      if (isErr(childT)) return childT;
    }
  } else if (childrenExpr) {
    const childT = api.infer(childrenExpr);
    if (isErr(childT)) return childT;
  }

  const zonkedTag = api.zonk(tagT.value);
  if (zonkedTag.kind === "arrow" && zonkedTag.from.kind === "record") {
    const uni = api.unify(propsT.value, zonkedTag.from, propsExpr.span);
    if (isErr(uni)) return uni;
    // Expected prop types on attr names — hover shows `"rose" | …`, not the
    // value-side lit that widenLits would turn into `string`.
    if (propsExpr.kind === "record") {
      for (const f of propsExpr.fields) {
        const expected = rowField(zonkedTag.from.row, f.name);
        if (expected)
          api.noteType(f.nameSpan, api.zonk(expected), { kind: "property", name: f.name });
      }
    }
    return ok(api.zonk(zonkedTag.to));
  }
  // Intrinsic / unknown tag: open props, result is VNode.
  return ok(tCon("VNode"));
};

// --------------------------------------------------------------- format

type JsxShape = { tag: Expr; props: RecordExpr; children: SeqElem[] };

/** The exact call shape the parser emits — anything else prints as a plain call. */
const jsxShape = (e: Expr): JsxShape | null => {
  if (
    e.kind !== "call" ||
    e.origin !== "jsx" ||
    e.fn.kind !== "ref" ||
    e.fn.name !== PRAGMA ||
    e.args.length !== 3 ||
    e.args[1]!.kind !== "record" ||
    e.args[2]!.kind !== "arr"
  )
    return null;
  return { tag: e.args[0]!, props: e.args[1]!, children: e.args[2]!.elements };
};

const jsxTag = (tag: Expr, api: FormatApi): string =>
  tag.kind === "str" ? tag.value : api.flat(api.memberD(tag));

const jsxAttrD = (name: string, value: Expr, nameStart: number, api: FormatApi): Doc => {
  if (value.kind === "bool" && value.value && value.span.start === nameStart) return txt(name);
  if (value.kind === "str") return txt(`${name}=${api.strLit(value.value)}`);
  return seq(txt(`${name}={`), api.exprD(value), txt("}"));
};

const jsxOpenD = (tag: string, attrs: Doc[], selfClosing: boolean): Doc => {
  if (attrs.length === 0) return txt(selfClosing ? `<${tag} />` : `<${tag}>`);
  return group(
    seq(
      txt(`<${tag}`),
      indent(cat(attrs.map((attr) => seq(line, attr)))),
      selfClosing ? line : softline,
      txt(selfClosing ? "/>" : ">"),
    ),
  );
};

const jsxChildD = (child: SeqElem, api: FormatApi): Doc => {
  if (child.kind === "expr" && jsxShape(child.expr)) return api.exprD(child.expr);
  return seq(txt(child.kind === "spread" ? "{..." : "{"), api.exprD(child.expr), txt("}"));
};

/** Re-fold a parser-produced `h(tag, props, children)` while retaining normal call formatting for source-written `h(...)`. */
const formatJsx: FormatHook = (e: Expr, api: FormatApi): Doc | null => {
  const shape = jsxShape(e);
  if (!shape) return null;
  const fragment = shape.tag.kind === "str" && shape.tag.value === FRAGMENT;
  const tag = fragment ? "" : jsxTag(shape.tag, api);
  const attrs = [
    ...(shape.props.spread ? [seq(txt("{..."), api.exprD(shape.props.spread), txt("}"))] : []),
    ...shape.props.fields.map((field) =>
      jsxAttrD(field.name, field.value, field.nameSpan.start, api),
    ),
  ];

  if (shape.children.length === 0 && !fragment) return jsxOpenD(tag, attrs, true);

  const open = fragment ? txt("<>") : jsxOpenD(tag, attrs, false);
  const close = txt(fragment ? "</>" : `</${tag}>`);
  return group(
    seq(
      open,
      indent(cat(shape.children.map((child) => seq(softline, jsxChildD(child, api))))),
      softline,
      close,
    ),
  );
};

// ------------------------------------------------------------ binding type

/** True when the (folded) type is a single record-arg arrow ending in `VNode`. */
const isComponentType = (t: Type): boolean => {
  if (t.kind !== "arrow" || t.from.kind !== "record") return false;
  let ret: Type = t.to;
  while (ret.kind === "arrow") ret = ret.to;
  return ret.kind === "con" && ret.name === "VNode";
};

/** Lambda whose body is parser-synthesized JSX (ADR 0011 §5 provenance) — used when the return type hasn't pinned to `VNode` yet. */
const isJsxComponentLambda = (value: Expr): boolean => {
  if (value.kind !== "lambda") return false;
  let body = value.body;
  while (body.kind === "lambda") body = body.body;
  return body.kind === "call" && body.origin === "jsx";
};

const componentPropFieldTs = (label: string, t: Type, api: BindingTypeApi): string => {
  if (t.kind === "var") {
    if (/^on[A-Z]/.test(label)) return "() => void";
    return "unknown";
  }
  if (t.kind === "con" && t.name === "Fn0") return "() => void";
  if (t.kind === "con" && t.name === "VNode") return "unknown";
  return api.tsType(t);
};

const componentPropsTs = (row: Row, api: BindingTypeApi): string => {
  const fields: string[] = [];
  let cur = row;
  let open = false;
  while (cur.kind === "extend") {
    fields.push(`${cur.label}: ${componentPropFieldTs(cur.label, cur.type, api)}`);
    cur = cur.rest;
  }
  if (cur.kind === "rvar") open = true;
  // Open prop rows (typical JSX lambdas): add conventional host extras rather than
  // an index signature (which fights `onX: () => void` under `--strict`).
  if (open) {
    if (!fields.some((f) => f.startsWith("children:"))) fields.push("children?: any");
    if (!fields.some((f) => f.startsWith("className:"))) fields.push("className?: string");
  }
  return fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
};

/**
 * Host-agnostic component signature, for the `.d.ts` writer AND the TS backend
 * (they share `bindingTsType`). Free prop fields → `unknown`, except `onX` event
 * handlers → `() => void`. Return is always `any` (not a host `FC`), and the
 * binding's escaped JSX vars are never quantified (ADR 0010 #17).
 */
const componentBindingTs: BindingTypeHook = (value: Expr, api: BindingTypeApi): string | null => {
  const t = api.folded;
  if (!isComponentType(t) && !isJsxComponentLambda(value)) return null;
  if (t.kind !== "arrow" || t.from.kind !== "record") {
    return "(props: Record<string, unknown>) => any";
  }
  return `(props: ${componentPropsTs(t.from.row, api)}) => any`;
};

export const jsxPlugin: LanguagePlugin = {
  name: "jsx",
  // Claim: JSX atoms start at `<` (the lexer's generic `lt` token).
  parse: { tokens: ["lt"], hook: parseJsxAtom },
  // No ref/memberTarget claims: the hook keys off `origin: "jsx"` provenance,
  // not a callee name — a hand-written `h(...)` is deliberately not claimed.
  inferCall: { hook: inferJsxCall },
  format: formatJsx,
  bindingType: componentBindingTs,
};
